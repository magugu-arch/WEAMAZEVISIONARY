import { expect, test } from '@playwright/test';

/** Addresses and states real visitors and crawlers produce, which must never throw. */
test('repeated slashes redirect once to the canonical page, which hydrates without errors', async ({ page, request, baseURL }) => {
  // Absolute URLs: a bare "//work" would be read as a host named "work".
  const origin = new URL(baseURL!).origin;
  const cases: [string, string][] = [['//work', '/work'], ['/work//my-backyard', '/work/my-backyard'], ['///', '/']];
  for (const [from, to] of cases) {
    const res = await request.get(`${origin}${from}`, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(new URL(res.headers()['location']!, 'http://x').pathname, from).toBe(to);
  }
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}//work`);
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the booking management page without its private link explains itself and asks the server nothing', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/api/booking/manage')) calls.push(r.url()); });
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/book-a-call/manage');
  await expect(page.getByText(/link in your booking confirmation email/)).toBeVisible();
  expect(calls).toEqual([]);
  expect(errors).toEqual([]);
});

test('hostile requests get clean refusals, never a server error', async ({ request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  expect((await request.get(`${origin}/%E0%A4%A`)).status()).toBe(400);
  const big = await request.post(`${origin}/api/enquiries`, { headers: { 'content-type': 'application/json' }, data: 'a'.repeat(200_000) });
  expect(big.status()).toBe(413);
  const cross = await request.post(`${origin}/api/enquiries`, { headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, data: '{}' });
  expect(cross.status()).toBe(403);
  for (const path of ['/.env', '/data/dev', '/server/node.js', '/package.json', '/%2e%2e/%2e%2e/etc/passwd']) {
    expect((await request.get(`${origin}${path}`)).status(), path).toBe(404);
  }
  expect((await request.get(`${origin}/`)).status()).toBe(200); // still serving
});

test('security.txt says where to report a vulnerability', async ({ request }) => {
  const res = await request.get('/.well-known/security.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/^Contact: mailto:weamazevisionary@gmail\.com$/m);
  expect(new Date(body.match(/^Expires: (.+)$/m)![1]!).getTime()).toBeGreaterThan(Date.now());
});

test('every page carries its security metadata, and every script and stylesheet is pinned to what was built', async ({ request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const { createHash } = await import('node:crypto');
  for (const path of ['/', '/work', '/contact', '/start-a-project', '/does-not-exist']) {
    const html = await (await request.get(`${origin}${path}`)).text();
    expect(html, path).toMatch(/<meta charset="UTF-8" \/>\s*<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self';/);
    expect(html, path).toContain('<meta name="referrer" content="strict-origin-when-cross-origin" />');
    const pinned = [...html.matchAll(/<(?:script|link)\b[^>]*\s(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"[^>]*>/g)].filter((m) => !m[0].includes('rel="preload"'));
    expect(pinned.length, path).toBeGreaterThan(2);
    for (const [tag, file] of pinned) {
      const integrity = /integrity="(sha384-[^"]+)"/.exec(tag)?.[1];
      expect(integrity, `${path} ${file}`).toBeTruthy();
      const body = await (await request.get(`${origin}${file}`)).body();
      expect(integrity, file).toBe(`sha384-${createHash('sha384').update(body).digest('base64')}`);
    }
  }
  const res = await request.get(`${origin}/`);
  expect(res.headers()['reporting-endpoints']).toBe('csp="/api/csp-report"');
  expect(res.headers()['content-security-policy']).toContain('report-to csp');
});

test('the form pages run without a single security-policy violation, on phones as well as desktops', async ({ browser, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    const violations: string[] = [];
    await page.exposeFunction('reportViolation', (v: string) => violations.push(v));
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => void (window as unknown as { reportViolation: (v: string) => void }).reportViolation(`${e.violatedDirective} ${e.blockedURI}`)));
    for (const path of ['/contact', '/start-a-project', '/book-a-call']) {
      await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
      // Submitting empty runs the validation library, which is where an eval probe would surface.
      await page.evaluate(() => document.querySelector<HTMLFormElement>('main form')?.requestSubmit());
      await page.waitForTimeout(300);
    }
    expect(violations, `${viewport.width}px`).toEqual([]);
    await ctx.close();
  }
});
