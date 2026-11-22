/**
 * Read-only check of a running copy of the Hostinger web hosting package, live or local:
 *   node scripts/verify-hostinger-live.mjs https://weamazevisionary.com
 * Nothing is submitted. It confirms the address rules (no redirect circle on folders, www to
 * the bare domain), the caching, the offline edition opened by its address, the per-film
 * dates, the form program's health and the 12 security headers. Exits 1 if any check fails.
 * See docs/14_DEPLOY_HOSTINGER.md, section 13, "Check it works".
 */
/* global document */
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https?:\/\//.test(BASE)) {
  console.error('Give the site address, for example: node scripts/verify-hostinger-live.mjs https://weamazevisionary.com');
  process.exit(1);
}
const live = BASE.startsWith('https://');
// Behind an outbound proxy (some build environments), the browser must be told about it.
const proxy = live && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
const b = await chromium.launch(proxy);
const ctx = await b.newContext();
const rq = ctx.request;
const results = [];
const check = (name, ok, detail) => results.push({ name, ok: Boolean(ok), detail });
const get = (p, o = {}) => rq.get(BASE + p, { maxRedirects: 0, ...o });

// 1. Folder addresses with no page end in "not found" and never go round in a circle. On
//    LiteSpeed a folder that has its own .htaccess (assets, downloads) is first given its
//    trailing slash by the server, so one redirect before the answer is allowed.
const folders = [];
for (const p of ['/images', '/images/', '/video', '/assets', '/assets/', '/downloads', '/downloads/', '/app-icons/']) {
  let url = BASE + p; let hops = 0; let r = await rq.get(url, { maxRedirects: 0 });
  while (r.status() >= 300 && r.status() < 400 && hops < 4) { url = new URL(r.headers().location ?? '', url).toString(); hops += 1; r = await rq.get(url, { maxRedirects: 0 }); }
  folders.push({ p, status: r.status(), hops });
}
check('folders with no page end in "not found" (no redirect circle)', folders.every((f) => f.status === 404 && f.hops <= 1), folders.map((f) => `${f.p}=${f.status}${f.hops ? ` after ${f.hops} redirect` : ''}`).join(' '));
// 2. Pages keep one address.
const work = await get('/work'); const slash = await get('/work/');
check('pages: /work loads, /work/ redirects once to /work', work.status() === 200 && slash.status() === 301 && /\/work$/.test(slash.headers().location || ''), `/work=${work.status()} /work/=${slash.status()} -> ${slash.headers().location}`);
// 3. www goes to the bare domain (live only: needs the real host name).
if (live) {
  const host = new URL(BASE).host; const r = await rq.get(`https://www.${host}/work`, { maxRedirects: 0 }).catch((e) => ({ status: () => 'ERR', headers: () => ({ location: e.message.slice(0, 60) }) }));
  check('www redirects to the bare domain', r.status() === 301 && r.headers().location === `https://${host}/work`, `${r.status()} -> ${r.headers().location}`);
}
// 4. Caching of hashed files, fonts included. The server's own answer is what is checked
//    (a fresh address bypasses any CDN copy); copies a CDN cached before an update keep
//    their old header until it refreshes them, which is reported but is not a fault.
const home = await (await get('/')).text();
const files = [...home.matchAll(/(?:href|src)="(\/assets\/[^"]+\.(?:js|css|woff2))"/g)].map((m) => m[1]);
const cache = [];
let staleCopies = 0;
for (const kind of ['.woff2', '.js', '.css']) {
  const f = files.find((x) => x.endsWith(kind));
  const fresh = (await rq.head(`${BASE}${f}?fresh=${Date.now()}`)).headers()['cache-control'];
  const served = (await rq.head(BASE + f)).headers()['cache-control'];
  if (served !== fresh) staleCopies += 1;
  cache.push(`${kind}: ${fresh}`);
}
check('scripts, styles and fonts are kept for a year', cache.every((c) => c.includes('max-age=31536000, immutable')), cache.join(' | ') + (staleCopies ? ` · note: the CDN still holds ${staleCopies} older cop${staleCopies === 1 ? 'y' : 'ies'} with the previous header; they refresh by themselves, or at once with "Clear cache" in hPanel` : ''));
// 5. Offline edition by its address: no site policy header, films and fonts not blocked.
const off = await rq.head(BASE + '/downloads/weamaze-visionary.html');
check('offline edition: the site policy header is left off, framing still forbidden', off.status() === 200 && off.headers()['content-security-policy'] === undefined && off.headers()['x-frame-options'] === 'DENY', `status ${off.status()} · policy header ${off.headers()['content-security-policy'] ? 'present' : 'absent'} · x-frame-options ${off.headers()['x-frame-options']}`);
const page = await ctx.newPage(); const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 90)); });
await page.goto(BASE + '/downloads/weamaze-visionary.html', { waitUntil: 'load', timeout: 120000 }).catch((e) => errors.push('goto: ' + e.message.slice(0, 80)));
await page.waitForTimeout(1500);
const info = await page.evaluate(() => ({ videos: document.querySelectorAll('video').length, blocked: [...document.querySelectorAll('video')].filter((v) => v.error || v.networkState === 3).length })).catch(() => ({ videos: 0, blocked: -1 }));
check('offline edition opened by its address: films and fonts load', info.videos > 0 && info.blocked === 0 && errors.length === 0, `${info.videos} films, ${info.blocked} blocked, ${errors.length} console errors`);
await page.close();
// 6. Per-film dates in the page data.
const dates = [];
for (const [slug, want] of [['the-form-of-whats-next', '2026-11-16'], ['my-backyard', '2026-11-07'], ['digitfms-nothing-moves-unseen', '2026-11-12']]) { const t = await (await get('/work/' + slug)).text(); const m = t.match(/"uploadDate":"([^"]+)"/); dates.push([slug, m && m[1], want]); }
check('each film carries its own date', dates.every(([, got, want]) => got === want), dates.map(([s, g]) => `${s}: ${g}`).join(' · '));
// 7. Forms program and security headers still in place.
const health = await (await get('/api/health')).json().catch(() => ({}));
check('form program answers and can store enquiries', health.ok === true && health.forms === 'php' && health.storage === 'ok', JSON.stringify(health));
const h = (await rq.head(BASE + '/')).headers();
const wanted = ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy', 'cross-origin-resource-policy', 'origin-agent-cluster', 'x-frame-options', 'x-xss-protection', 'x-permitted-cross-domain-policies', 'x-dns-prefetch-control'];
const present = wanted.filter((k) => h[k] !== undefined).length;
check('all 12 security headers are sent', present === 12, `${present} of 12`);
const script = (home.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
console.log(`site: ${BASE} · main script: ${script}`);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}\n        ${r.detail}`);
console.log(results.every((r) => r.ok) ? 'ALL CHECKS PASSED' : `${results.filter((r) => !r.ok).length} CHECK(S) FAILED`);
await b.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
