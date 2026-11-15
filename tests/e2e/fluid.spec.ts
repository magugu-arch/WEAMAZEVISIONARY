import { expect, test } from '@playwright/test';
import type { CDPSession, Page } from '@playwright/test';

/** Fluid-interface and platform features (gestures, sharing, offline download, preview metadata). */

async function touchDrag(page: Page, cdp: CDPSession, from: { x: number; y: number }, to: { x: number; y: number }, steps = 8, stepMs = 0, holdMs = 0) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    if (stepMs) await page.waitForTimeout(stepMs);
  }
  if (holdMs) await page.waitForTimeout(holdMs);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const settle = (page: Page) => page.waitForTimeout(900);

test('gallery: a sideways swipe moves one image and a downward swipe dismisses', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/work/digitfms-nothing-moves-unseen');
  await page.getByRole('button', { name: /Open image 1 of 6/ }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByText('Image 1 of 6')).toBeVisible();
  const box = (await page.getByTestId('gallery-viewport').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  // Drag left past the midpoint → next image, even with no release velocity (one image per gesture).
  await page.mouse.move(cx + box.width * 0.35, cy);
  await page.mouse.down();
  await page.mouse.move(cx - box.width * 0.3, cy, { steps: 6 });
  await page.mouse.up();
  await expect(dlg.getByText('Image 2 of 6')).toBeVisible();
  // Small, slow drag springs back without changing image.
  await settle(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 30, cy, { steps: 10 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await settle(page);
  await expect(dlg.getByText('Image 2 of 6')).toBeVisible();
  // Rubber-band at the first image: dragging right from image 1 stays on image 1.
  await page.keyboard.press('ArrowLeft');
  await expect(dlg.getByText('Image 1 of 6')).toBeVisible();
  await settle(page);
  await page.mouse.move(cx - 100, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 300, cy, { steps: 6 });
  await page.mouse.up();
  await settle(page);
  await expect(dlg.getByText('Image 1 of 6')).toBeVisible();
  // Swipe down past 35% of the height to close; focus returns to the thumbnail.
  await page.mouse.move(cx, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(cx, box.y + box.height * 0.8, { steps: 6 });
  await page.mouse.up();
  await expect(dlg).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole('button', { name: /Open image 1 of 6/ })).toBeFocused();
});

test('mobile drawer: swipe right with touch to dismiss; a short swipe springs back', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  const dlg = page.getByRole('dialog', { name: 'Menu' });
  await expect(dlg).toBeVisible();
  await settle(page);
  // Slow drag, then the finger rests before lifting: no momentum, so it springs home.
  await touchDrag(page, cdp, { x: 120, y: 420 }, { x: 170, y: 422 }, 10, 30, 150);
  await settle(page);
  await expect(dlg).toBeVisible();
  // Quick flick to the right: momentum carries it past 40% of the width, so it dismisses.
  await touchDrag(page, cdp, { x: 80, y: 420 }, { x: 220, y: 425 }, 5);
  await expect(dlg).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  await ctx.close();
});

test('share controls: WhatsApp universal link and copy-link confirmation', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ permissions: ['clipboard-write'] });
  const page = await ctx.newPage();
  // The site's Permissions-Policy forbids reading the clipboard (clipboard-read=()), so record
  // what the page writes instead of reading it back.
  await page.addInitScript(() => {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text: string) => { (window as unknown as { copied: string }).copied = text; return write(text); };
  });
  await page.goto(`${baseURL}/insights/human-led-ai-how-we-direct-review-and-stay-accountable`);
  const wa = page.getByRole('link', { name: /WhatsApp/ });
  const href = (await wa.getAttribute('href'))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent(href)).toContain('/insights/human-led-ai-how-we-direct-review-and-stay-accountable');
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toContain('/insights/human-led-ai');
  expect(await page.evaluate(() => navigator.clipboard.readText().then(() => 'read', () => 'refused'))).toBe('refused');
  await ctx.close();
});

test('offline edition is downloadable from every page footer', async ({ page, request }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Offline edition (HTML)' });
  await expect(link).toHaveAttribute('download', '');
  const res = await request.get('/downloads/weamaze-visionary.html');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/html');
  expect((await res.body()).length).toBeGreaterThan(1_000_000);
});

test('link previews (WhatsApp, iMessage, Android) get complete Open Graph image metadata', async ({ request }) => {
  for (const path of ['/', '/services/apps-digital-products', '/work/digitfms-nothing-moves-unseen']) {
    const html = await (await request.get(path)).text();
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) {
      expect(html, `${path} ${prop}`).toContain(`property="${prop}"`);
    }
    expect(html).toContain('name="twitter:image:alt"');
  }
  const film = await (await request.get('/work/digitfms-nothing-moves-unseen')).text();
  expect(film).toContain('"@type":"VideoObject"');
  expect(film).toContain('kind="descriptions"');
  const home = await (await request.get('/')).text();
  expect(home).toContain('"@type":"VideoObject"');
  expect(home).toContain('"duration":"PT1M45S"');
  expect(home).toContain('kind="captions"');
});
