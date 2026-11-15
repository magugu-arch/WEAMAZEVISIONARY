import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/**
 * The downloadable single-file edition, opened from disk (file://) as it would
 * be after downloading on Android/iOS or opening from WhatsApp. Chromium with
 * phone emulation; real iOS Safari/Quick Look must still be checked on a device.
 */
const FILE = pathToFileURL(resolve('dist/client/downloads/weamaze-visionary.html')).href;
const PHONES = {
  iphone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  android: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Mobile Safari/537.36' },
} as const;

for (const [name, device] of Object.entries(PHONES)) {
  for (const js of [true, false]) {
    test(`${name}, JavaScript ${js ? 'on' : 'off (WhatsApp/iOS Quick Look)'}: complete, self-contained and readable`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...device, javaScriptEnabled: js });
      const page = await ctx.newPage();
      const external: string[] = [];
      page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
      await page.goto(FILE, { waitUntil: 'load' });
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ideas with intent.Experiences with impact.');
      expect(await page.locator('h2').count()).toBeGreaterThanOrEqual(9);
      // Every image decoded from embedded data.
      await page.evaluate(async () => {
        for (const img of Array.from(document.images)) {
          img.loading = 'eager';
          if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
        }
      });
      const broken = await page.evaluate(() => Array.from(document.images).filter((i) => !i.naturalWidth).length);
      expect(broken).toBe(0);
      // Film: embedded source; with JS off, native controls give a way to pause.
      const film = page.locator('video[data-sa-film]');
      await expect(film).toHaveAttribute('poster', /^data:image\/webp/);
      expect(await film.getAttribute('src')).toMatch(/^data:video\/mp4;base64,/);
      expect(await film.locator('track[kind="captions"]').getAttribute('src')).toMatch(/^data:text\/vtt/);
      expect(await film.locator('track[kind="descriptions"]').getAttribute('src')).toMatch(/^data:text\/vtt/);
      await page.waitForFunction(() => ((document.querySelector('video[data-sa-film]') as HTMLVideoElement | null)?.readyState ?? 0) >= 1, null, { timeout: 15_000 });
      expect(await film.evaluate((v: HTMLVideoElement) => v.duration)).toBeGreaterThan(100); // the whole film, not a loop
      if (!js) {
        // Quick Look / WhatsApp viewer: a poster with native controls; nothing starts by itself.
        await expect(film).toHaveAttribute('controls', '');
        expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
      } else {
        await expect(page.getByRole('button', { name: /^Watch the film.*with sound/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Pause film|Play film/ })).toBeVisible();
      }
      // Native accordions open without script.
      const first = page.locator('#services details').first();
      await first.locator('summary').click();
      await expect(first).toHaveAttribute('open', '');
      await expect(first.getByText('How it works')).toBeVisible();
      // In-page navigation only.
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
      expect(hrefs.filter((h) => !h.startsWith('#') && !h.startsWith('mailto:'))).toEqual([]);
      // No horizontal overflow.
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      expect(external).toEqual([]);
      await page.screenshot({ path: `docs/qa/screens/offline-edition_${name}_js-${js ? 'on' : 'off'}.jpg`, type: 'jpeg', quality: 70 });
      await ctx.close();
    });
  }
}

test('offline edition: 320 px reflow, reduced motion and WCAG 2.2 AA scan', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 720 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(FILE, { waitUntil: 'load' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  // Reduced motion: the film never starts by itself; it waits as a poster with native controls.
  const film = page.locator('video[data-sa-film]');
  await expect(film).toBeVisible();
  await expect(film).toHaveAttribute('controls', '');
  expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
  await ctx.close();
});

test('offline edition: desktop gallery buttons and keyboard-focusable rails', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(FILE, { waitUntil: 'load' });
  const rail = page.locator('[data-sa-rail]').first();
  await rail.scrollIntoViewIfNeeded();
  const before = await rail.evaluate((el) => el.scrollLeft);
  await page.getByRole('button', { name: 'Next image' }).first().click();
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  await rail.focus();
  await expect(rail).toBeFocused();
  await page.screenshot({ path: 'docs/qa/screens/offline-edition_desktop_1440.jpg', type: 'jpeg', quality: 70 });
  await ctx.close();
});

test('the offline file may load nothing from anywhere, and its own script is pinned by hash', async ({ page }) => {
  const { readFileSync } = await import('node:fs');
  const { createHash } = await import('node:crypto');
  const html = readFileSync(resolve('dist/client/downloads/weamaze-visionary.html'), 'utf8');
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? '';
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("connect-src 'none'");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
  expect(scripts).toHaveLength(1);
  expect(csp).toContain(`'sha256-${createHash('sha256').update(scripts[0]!).digest('base64')}'`);
  expect(html).toContain('<meta name="referrer" content="no-referrer" />');

  const violations: string[] = [];
  await page.exposeFunction('reportViolation', (v: string) => violations.push(v));
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => void (window as unknown as { reportViolation: (v: string) => void }).reportViolation(`${e.violatedDirective} ${e.blockedURI}`)));
  await page.goto(FILE);
  await page.waitForTimeout(800);
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => fetch('https://example.com').then(() => 'loaded', () => 'blocked'))).toBe('blocked');
});

test('offline edition: Back to top is a plain link that works with scripts off', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(FILE);
  const top = page.getByTestId('return-home');
  await expect(top).toHaveAttribute('href', '#top');
  await top.scrollIntoViewIfNeeded();
  await top.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
  await ctx.close();
});
