import type { IncomingMessage, ServerResponse } from 'node:http';

/** Thrown when a request body is larger than the API accepts; the caller answers 413. */
export class BodyTooLarge extends Error {}
const BODY_LIMIT = 64 * 1024;

/** Converts a Node request to a Fetch API Request. Bodies over 64 KB are refused, not truncated. */
export async function toRequest(req: IncomingMessage, origin: string): Promise<Request> {
  // Parse the raw path against a fixed origin: new URL('//x', base) would read "x" as a host.
  const raw = req.url ?? '/';
  const url = new URL(`${origin}${raw.startsWith('/') ? raw : `/${raw}`}`);
  if (Number(req.headers['content-length'] ?? 0) > BODY_LIMIT) throw new BodyTooLarge();
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
    else if (v !== undefined) headers.set(k, v);
  }
  let body: Buffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > BODY_LIMIT) throw new BodyTooLarge();
      chunks.push(chunk as Buffer);
    }
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body: body ? new Uint8Array(body) : undefined });
}

export async function sendResponse(res: ServerResponse, response: Response, extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extraHeaders };
  response.headers.forEach((v, k) => { headers[k] = v; });
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}

/**
 * The visitor's address, for rate limiting. X-Forwarded-For is a list the visitor can
 * start with any value they like, so the left-most entry is never trusted. Each trusted
 * proxy appends the address it received the request from; with `hops` trusted proxies
 * in front (Cloudflare then the host's edge = 2), the visitor is the entry `hops` places
 * from the right. With no proxy configured, the socket address is used.
 */
export function clientIp(req: IncomingMessage, trustProxy: boolean, hops = 1): string {
  const socketIp = req.socket?.remoteAddress ?? 'unknown';
  if (!trustProxy) return socketIp;
  const fwd = req.headers['x-forwarded-for'];
  const list = (Array.isArray(fwd) ? fwd.join(',') : fwd ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return list[list.length - Math.max(1, hops)] ?? list[0] ?? socketIp;
}
