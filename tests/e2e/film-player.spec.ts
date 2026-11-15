import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The studio film: a muted opening loop in the hero, and the whole film with sound
 * only when a visitor asks for it ("Watch the film").
 */
test('nothing heavy or audible loads until the visitor asks; then the film plays with sound', async ({ page }) => {
  const fullFilmRequests: string[] = [];
  page.on('request', (r) => { if (/studio-film-720p/.test(r.url())) fullFilmRequests.push(r.url()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  expect(fullFilmRequests).toEqual([]);
  // The hero loop is muted.
  expect(await page.locator('section[aria-labelledby="hero-title"] video').first().evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);

  const trigger = page.getByRole('button', { name: /^Watch the film/ });
  await expect(trigger).toHaveAccessibleName(/1 minute 45 seconds, with sound/);
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /WeAmaze Visionary studio film/ });
  await expect(dialog).toBeVisible();
  const film = dialog.locator('video');
  await expect(film).toBeFocused();
  await expect(film).toHaveAttribute('controls', '');
  await expect(film.locator('track[kind="captions"]')).toHaveCount(1);
  await expect(film.locator('track[kind="descriptions"]')).toHaveCount(1);
  await page.waitForFunction(() => {
    const v = document.querySelector('dialog[open] video') as HTMLVideoElement | null;
    return Boolean(v && !v.paused && v.currentTime > 0.3);
  }, null, { timeout: 15_000 });
  expect(await film.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
  expect(fullFilmRequests.length).toBeGreaterThan(0);
  // The background loop rests while the film plays.
  expect(await page.locator('section[aria-labelledby="hero-title"] video').first().evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  // Scene-by-scene description is available as text.
  await dialog.getByText('Scene-by-scene description').click();
  await expect(dialog.getByText(/Animation\./)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.locator('dialog.wv-film-dialog video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test('close button and the dimmed surround both close; page scroll is locked while open', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Watch the film/ });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /studio film/ });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await dialog.getByRole('button', { name: 'Close film' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(8, 790); // the dimmed surround, outside the player
  await expect(dialog).toBeHidden();
});

test('phone: controls sit on the film window, and the player fits the screen', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Watch the film/ });
  const frame = await page.locator('[data-parallax-frame]').first().boundingBox();
  const box = await trigger.boundingBox();
  expect(frame && box).toBeTruthy();
  expect(box!.y + box!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await trigger.tap();
  const dialog = page.getByRole('dialog', { name: /studio film/ });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(700); // let the grow-in spring settle before measuring
  const v = await dialog.locator('video').boundingBox();
  expect(v!.width).toBeLessThanOrEqual(390);
  expect(v!.x).toBeGreaterThanOrEqual(0);
  const close = await dialog.getByRole('button', { name: 'Close film' }).boundingBox();
  expect(close!.width).toBeGreaterThanOrEqual(44);
  expect(close!.height).toBeGreaterThanOrEqual(44);
  await ctx.close();
});

test('reduced motion: the player fades instead of growing, and still plays on request', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: /^Watch the film/ }).click();
  const dialog = page.getByRole('dialog', { name: /studio film/ });
  await expect(dialog).toBeVisible();
  expect(await dialog.locator('.wv-film-panel').evaluate((el) => getComputedStyle(el).scale)).toBe('none');
  await page.waitForFunction(() => {
    const v = document.querySelector('dialog[open] video') as HTMLVideoElement | null;
    return Boolean(v && !v.paused);
  }, null, { timeout: 15_000 });
  await ctx.close();
});

test('player passes an automated WCAG 2.2 AA scan while open', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Watch the film/ }).click();
  await expect(page.getByRole('dialog', { name: /studio film/ })).toBeVisible();
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page }).include('dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
});

test('the player hides the page completely: no page text ghosts behind the film or its description', async ({ browser }) => {
  for (const [w, h] of [[390, 844], [1440, 900]] as const) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /^Watch the film/ }).click();
    const dialog = page.getByRole('dialog', { name: /studio film/ });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700);
    const bg = await dialog.evaluate((d) => getComputedStyle(d).backgroundColor);
    expect(bg).toBe('rgb(17, 17, 20)'); // solid Onyx
    expect(await dialog.evaluate((d) => getComputedStyle(d).opacity)).toBe('1');
    await ctx.close();
  }
});
