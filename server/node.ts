/**
 * Production server: static prerendered site + API on one Node process.
 * Host-agnostic (any Node 22 host or container). Behind a CDN/proxy set
 * TRUST_PROXY=true and FORCE_HSTS=true.
 */
import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createApi } from './api/router';
import { applyBuildDefaults, readBuildInfo } from './lib/buildInfo';
import { serverEnv } from './lib/env';
import { log } from './lib/log';
import { regionRole, routeApi } from './lib/region';
import { BodyTooLarge, clientIp, sendResponse, toRequest } from './lib/nodeAdapter';
import { isSelfContainedDownload, securityHeaders, withoutSitePolicy } from './lib/security';

const here = fileURLToPath(new URL('.', import.meta.url));
// Take the site mode from the build when the host does not set it (server/lib/buildInfo.ts).
const buildCheck = applyBuildDefaults(process.env, readBuildInfo(here));
const env = serverEnv();
if (buildCheck.mismatch) log('warn', 'server.site_env_mismatch', buildCheck.mismatch);
const ROOT = resolve(here, '../client');
const api = createApi(env);
// Only the primary region keeps data, so only it delivers queued emails and CRM updates.
const role = regionRole(env);
if (role.role === 'primary') api.outbox.start();
else log(role.role === 'replica' ? 'info' : 'error', 'server.region', { role: role.role, region: role.region, primary: role.primary });
const baseHeaders = securityHeaders({ hsts: env.FORCE_HSTS === 'true', indexable: env.PUBLIC_SITE_ENV === 'production' });
const redirects: Record<string, string> = existsSync(join(ROOT, 'redirects.json')) ? JSON.parse(readFileSync(join(ROOT, 'redirects.json'), 'utf8')) : {};

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.md': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt', '.webmanifest']);
// Larger files (the 9–18 MB offline edition, mostly embedded media) gain little from
// compression, and compressing them on first request would block every other visitor for
// many seconds. They are streamed as they are, with byte ranges for resumable downloads.
const COMPRESS_MAX_BYTES = 2 * 1024 * 1024;
const compressedCache = new Map<string, { br: Buffer; gz: Buffer; mtime: number }>();

function cacheControl(path: string): string {
  if (path.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (path.endsWith('.html') || path.endsWith('.xml') || path.endsWith('.txt')) return 'no-cache';
  return 'public, max-age=604800, stale-while-revalidate=86400';
}

function resolveFile(urlPath: string): { file: string; status: number } {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.(\/|\\|$))+/, '');
  const candidates = extname(safe) ? [safe] : [join(safe, 'index.html'), `${safe}.html`];
  for (const c of candidates) {
    const abs = resolve(ROOT, `.${sep}${c}`);
    if (!abs.startsWith(ROOT)) break;
    if (existsSync(abs) && statSync(abs).isFile()) return { file: abs, status: 200 };
  }
  return { file: join(ROOT, '404.html'), status: 404 };
}

/**
 * Stream a file to the response. `pipeline` destroys the file stream when the visitor
 * stops early (closing the film player mid-stream, seeking, leaving the page), so file
 * handles are never left open, and a read error can never crash the process.
 */
function stream(file: NodeJS.ReadableStream, res: ServerResponse, path: string) {
  pipeline(file, res, (err) => {
    if (err && (err as NodeJS.ErrnoException).code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      log('warn', 'server.stream_error', { path, error: err.message.slice(0, 120) });
    }
  });
}

const server = createServer(async (req, res) => {
  // Parse the raw path against a fixed origin: new URL('//x', base) would read "x" as a host.
  const url = new URL(`http://local${(req.url ?? '/').startsWith('/') ? req.url ?? '/' : `/${req.url}`}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      // Outside the primary region, hand data requests to it before reading the body.
      const route = routeApi(role, url.pathname);
      if (route.action === 'replay') {
        res.writeHead(409, { ...baseHeaders, 'fly-replay': route.header, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(JSON.stringify({ ok: false, error: 'unavailable', message: 'Please try again in a moment.' }));
      }
      if (route.action === 'refuse') {
        res.writeHead(503, { ...baseHeaders, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30', connection: 'close' });
        return res.end(JSON.stringify({ ok: false, error: 'unavailable', message: 'This service is temporarily unavailable. Please try again shortly.' }));
      }
      // Read the address before the body: a refused body closes the socket.
      const ip = clientIp(req, env.TRUST_PROXY === 'true', env.TRUST_PROXY_HOPS);
      let request: Request;
      try {
        request = await toRequest(req, 'http://local');
      } catch (e) {
        if (!(e instanceof BodyTooLarge)) throw e;
        res.writeHead(413, { ...baseHeaders, 'content-type': 'application/json; charset=utf-8', connection: 'close' });
        return res.end(JSON.stringify({ ok: false, error: 'rejected', message: 'This submission is too large.' }));
      }
      return await sendResponse(res, await api.handle(request, ip), baseHeaders);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { ...baseHeaders, allow: 'GET, HEAD' });
      return res.end();
    }
    // Single-hop permanent redirects: register and trailing slashes.
    // Repeated slashes ("//work", "/work//x") would serve the wrong page under the right
    // content and break hydration; collapse them in the same single hop.
    const tidy = url.pathname.replace(/\/{2,}/g, '/');
    const target = redirects[tidy] ?? (tidy.length > 1 && tidy.endsWith('/') ? tidy.replace(/\/+$/, '') : tidy !== url.pathname ? tidy : null);
    if (target) {
      res.writeHead(301, { ...baseHeaders, location: `${target}${url.search}`, 'cache-control': 'public, max-age=3600' });
      return res.end();
    }
    const { file, status } = resolveFile(url.pathname);
    const ext = extname(file);
    const stat = statSync(file);
    // The offline edition carries its own policy; the site's would block what is embedded in it.
    const fileHeaders = status === 200 && isSelfContainedDownload(url.pathname) ? withoutSitePolicy(baseHeaders) : baseHeaders;
    const headers: Record<string, string> = { ...fileHeaders, 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': status === 404 ? 'no-cache' : cacheControl(url.pathname.endsWith('/') || !extname(url.pathname) ? '/x.html' : url.pathname), 'last-modified': stat.mtime.toUTCString() };

    // Byte ranges: required by Safari for video, and lets large downloads resume.
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm' || stat.size > COMPRESS_MAX_BYTES)) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m?.[1] ? Number(m[1]) : 0;
      const end = m?.[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
      if (start >= stat.size || start > end) {
        res.writeHead(416, { ...headers, 'content-range': `bytes */${stat.size}` });
        return res.end();
      }
      res.writeHead(206, { ...headers, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${stat.size}`, 'content-length': String(end - start + 1) });
      if (req.method === 'HEAD') return res.end();
      return stream(createReadStream(file, { start, end }), res, url.pathname);
    }

    const accept = String(req.headers['accept-encoding'] ?? '');
    if (COMPRESSIBLE.has(ext) && stat.size <= COMPRESS_MAX_BYTES) {
      let entry = compressedCache.get(file);
      if (!entry || entry.mtime !== stat.mtimeMs) {
        const buf = readFileSync(file);
        entry = { br: brotliCompressSync(buf), gz: gzipSync(buf), mtime: stat.mtimeMs };
        compressedCache.set(file, entry);
      }
      const enc = accept.includes('br') ? 'br' : accept.includes('gzip') ? 'gzip' : null;
      const body = enc === 'br' ? entry.br : enc === 'gzip' ? entry.gz : readFileSync(file);
      res.writeHead(status, { ...headers, vary: 'Accept-Encoding', ...(enc ? { 'content-encoding': enc } : {}), 'content-length': String(body.length) });
      return res.end(req.method === 'HEAD' ? undefined : body);
    }
    res.writeHead(status, { ...headers, 'accept-ranges': 'bytes', 'content-length': String(stat.size) });
    if (req.method === 'HEAD') return res.end();
    stream(createReadStream(file), res, url.pathname);
  } catch (e) {
    // A malformed address (for example a broken %-escape) is the visitor's error, not ours.
    if (e instanceof URIError) {
      if (!res.headersSent) res.writeHead(400, { ...baseHeaders, 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Bad request');
    }
    log('error', 'server.unhandled', { path: url.pathname, error: e instanceof Error ? e.message.slice(0, 120) : 'unknown' });
    if (!res.headersSent) res.writeHead(500, { ...baseHeaders, 'content-type': 'text/plain; charset=utf-8' });
    res.end('Internal error');
  }
});

// Keep idle connections open longer than typical CDN / load-balancer idle timeouts (60 s), so a
// client reusing a connection never races the server closing it (which surfaces as ECONNRESET).
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
// A whole request must arrive within two minutes, so slow-drip connections cannot pile up.
server.requestTimeout = 120_000;
server.maxHeadersCount = 100;
server.listen(env.PORT, env.HOST, () => log('info', 'server.listening', { host: env.HOST, port: env.PORT, siteEnv: env.PUBLIC_SITE_ENV, nodeEnv: env.NODE_ENV }));
const shutdown = () => { api.outbox.stop(); server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
