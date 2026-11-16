#!/usr/bin/env node
/**
 * Static prerender (SSG). Renders every public route to crawlable HTML with
 * route-specific metadata, preloads the route's JS chunk and the LCP fonts,
 * and writes sitemap.xml, robots.txt and 404.html.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeArtifact, writeStandalone } from './standalone.mjs';
import { heldBackWork, scrubOutput } from './hold-back.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const client = join(root, 'dist/client');
const template = readFileSync(join(client, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(client, '.vite/manifest.json'), 'utf8'));
const ssr = await import(pathToFileURL(join(root, 'dist/ssr/entry-server.js')).href);

const assets = readdirSync(join(client, 'assets'));
const font = (re) => assets.find((f) => re.test(f));
const fontPreloads = [font(/^geist-latin-wght-normal-.*\.woff2$/), font(/^cormorant-garamond-latin-400-normal-.*\.woff2$/)]
  .filter(Boolean)
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`);

function chunkPreloads(file) {
  const seen = new Set();
  const out = [];
  const walk = (key) => {
    const e = manifest[key];
    if (!e || seen.has(key)) return;
    seen.add(key);
    out.push(`<link rel="modulepreload" href="/${e.file}" />`);
    for (const imp of e.imports ?? []) walk(imp);
  };
  walk(file);
  return out;
}

/**
 * Security metadata for every page:
 * - a <meta> copy of the Content Security Policy and the referrer policy, so the rules still
 *   hold if a page is ever served without the server's headers;
 * - Subresource Integrity on the site's own scripts and stylesheet: the browser refuses any
 *   file whose contents differ from what was built, so a tampered file on a CDN or proxy
 *   cannot run. Font preloads are left alone, because the @font-face fetch carries no hash.
 */
const sri = new Map();
const hashOf = (rel) => {
  if (!sri.has(rel)) sri.set(rel, `sha384-${createHash('sha384').update(readFileSync(join(client, rel))).digest('base64')}`);
  return sri.get(rel);
};
function secure(page) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${ssr.META_CSP}" />\n    <meta name="referrer" content="${ssr.REFERRER_POLICY}" />`;
  if (!/<meta charset="UTF-8" \/>/i.test(page)) throw new Error('Prerender: template has no <meta charset>');
  return page
    .replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}\n    ${meta}`)
    .replace(/<(script|link)\b([^>]*?)\s(src|href)="(\/assets\/[^"]+\.(?:js|css))"([^>]*?)(\s*\/?)>/g, (tag, name, pre, attr, path, post, close) => {
      if (tag.includes('integrity=')) return tag;
      if (name === 'link' && !/rel="(?:modulepreload|stylesheet)"/.test(tag)) return tag;
      return `<${name}${pre} ${attr}="${path}" integrity="${hashOf(path.slice(1))}"${post}${close}>`;
    });
}

async function renderRoute(url) {
  const { html, head, status, routeFile } = await ssr.render(url);
  const extra = [...fontPreloads, ...chunkPreloads(routeFile)];
  if (url === '/') extra.unshift('<link rel="preload" as="image" href="/video/studio-film-poster-desktop.avif" type="image/avif" media="(min-width: 48rem)" fetchpriority="high" />', '<link rel="preload" as="image" href="/video/studio-film-poster-mobile.avif" type="image/avif" media="(max-width: 47.99rem)" fetchpriority="high" />');
  const page = secure(template.replace('<!--app-head-->', `${head}\n    ${extra.join('\n    ')}`).replace('<!--app-html-->', html));
  return { page, status };
}

const routes = ssr.publicRoutes();
if (ssr.SITE_ENV !== 'production') routes.push('/system');
routes.push('/book-a-call/manage');
let count = 0;
for (const url of routes) {
  const { page, status } = await renderRoute(url);
  if (status !== 200) throw new Error(`Prerender: ${url} returned ${status}`);
  const out = url === '/' ? join(client, 'index.html') : join(client, url, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page);
  count++;
}
const nf = await renderRoute('/__not-found__');
writeFileSync(join(client, '404.html'), nf.page);

// Sitemap: canonical, published, indexable routes only.
const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ssr.sitemapRoutes().map((r) => `  <url><loc>${ssr.SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
writeFileSync(join(client, 'sitemap.xml'), sitemap);
// Robots: staging blocks everything; production blocks only API, system and private routes.
// AI assistants: answer and search crawlers are always welcome (they are how the studio is
// found and cited in ChatGPT, Claude, Perplexity and AI search). Crawlers that collect
// training data are an owner choice: AI_TRAINING_CRAWLERS=block turns them away (D-32).
const PRIVATE = 'Disallow: /api/\nDisallow: /book-a-call/manage\nDisallow: /system\n';
const AI_ANSWER_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
const AI_TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
const blockTraining = process.env.AI_TRAINING_CRAWLERS === 'block';
const robots = ssr.INDEXABLE
  ? [
      `User-agent: *\n${PRIVATE}`,
      `# AI answer and search crawlers\n${AI_ANSWER_BOTS.map((b) => `User-agent: ${b}`).join('\n')}\n${PRIVATE}`,
      `# AI training crawlers (${blockTraining ? 'blocked' : 'allowed'} by AI_TRAINING_CRAWLERS)\n${AI_TRAINING_BOTS.map((b) => `User-agent: ${b}`).join('\n')}\n${blockTraining ? 'Disallow: /\n' : PRIVATE}`,
      `Sitemap: ${ssr.SITE_URL}/sitemap.xml\n`,
    ].join('\n')
  : `# Staging build — not for indexing\nUser-agent: *\nDisallow: /\n`;
writeFileSync(join(client, 'robots.txt'), robots);
// llms.txt: a plain-language site map for AI assistants (production only; staging is not for indexing).
if (ssr.INDEXABLE) writeFileSync(join(client, 'llms.txt'), ssr.llmsTxt());
writeFileSync(join(client, 'redirects.json'), JSON.stringify({}, null, 2) + '\n');
// security.txt (RFC 9116): where to report a vulnerability. Renewed with every build.
mkdirSync(join(client, '.well-known'), { recursive: true });
const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, '.000Z');
writeFileSync(join(client, '.well-known', 'security.txt'), [
  `Contact: mailto:${ssr.SECURITY_CONTACT}`,
  `Expires: ${expires}`,
  'Preferred-Languages: en',
  `Canonical: ${ssr.SITE_URL}/.well-known/security.txt`,
  '',
].join('\n'));
// Offline single-file edition (downloadable from the footer).
const cssFile = manifest['index.html'].css[0];
const sa = ssr.renderStandalone(new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));
const saOut = join(client, 'downloads', 'weamaze-visionary.html');
const saInfo = writeStandalone({ clientDir: client, cssFile, html: sa.html, head: sa.head, outFile: saOut });
if (saInfo.external.length) throw new Error(`Offline edition references external resources: ${saInfo.external.join(', ')}`);
console.log(`Offline edition: downloads/weamaze-visionary.html · ${(saInfo.bytes / 1024 / 1024).toFixed(2)} MB · 0 external requests`);
// The same edition for Claude Artifacts (dist/artifact, not deployed): media as files beside a light page.
const art = writeArtifact({
  clientDir: client, cssFile, html: sa.html, outDir: join(root, 'dist/artifact'),
  swap: {
    '/video/studio-film-360p.mp4': '/video/studio-film-540p.mp4',
    '/video/digitfms-360p.mp4': '/video/digitfms-720p.mp4',
    '/video/mrb-360p.mp4': '/video/mrb-720p.mp4',
    '/video/backyard-360p.mp4': '/video/backyard-720p.mp4',
    '/video/herown-360p.mp4': '/video/herown-720p.mp4',
    '/video/form-360p.mp4': '/video/form-720p.mp4',
  },
});
if (art.external.length) throw new Error(`Artifact edition references external resources: ${art.external.join(', ')}`);
console.log(`Artifact edition: dist/artifact · page ${(art.pageBytes / 1024 / 1024).toFixed(2)} MB + ${art.files.length} media files · ${(art.totalBytes / 1024 / 1024).toFixed(1)} MB in all`);
rmSync(join(root, 'dist/ssr'), { recursive: true, force: true });
// Production: work not cleared for publication leaves no text, image, film or caption behind (hold-back.ts).
if (ssr.SITE_ENV === 'production') {
  const held = await heldBackWork(root);
  const { removedFiles } = scrubOutput(client, held);
  console.log(`Held back until permission: ${held.slugs.length} projects · ${removedFiles} media files removed · build verified clean`);
}
// The server takes its site mode from this when PUBLIC_SITE_ENV is not set where it runs
// (server/lib/buildInfo.ts), so a production build can never be served as a hidden staging site.
writeFileSync(join(root, 'dist/server/build.json'), JSON.stringify({ siteEnv: ssr.SITE_ENV, siteUrl: ssr.SITE_URL, builtAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`Prerendered ${count} routes + 404 · sitemap ${ssr.sitemapRoutes().length} URLs · env ${ssr.SITE_ENV} · indexable ${ssr.INDEXABLE}`);
