import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/** Film case studies: the film first, then the strategy, then the storyboard with its script and shots as text. */
const CASES: { slug: string; key: string; h1: string; firstLine: string; board: RegExp; label?: string }[] = [
  { slug: 'digitfms-nothing-moves-unseen', key: 'digitfms', h1: 'DigitFMS: Nothing moves unseen', firstLine: 'Every business', board: /30-second TVC storyboard/ },
  { slug: 'miss-rhee-beauty-the-space-of-restoration', key: 'mrb', h1: 'Miss Rhee Beauty: The Space of Restoration', firstLine: 'Your beauty was never lost…', board: /Director’s storyboard/ },
  { slug: 'my-backyard', key: 'backyard', h1: 'My Backyard', firstLine: 'FATHER: What’s happening?', board: /Fifteen-panel storyboard/, label: 'Studio Concept' },
];

for (const c of CASES) {
  test(`${c.key}: film plays with sound only on request, storyboard opens full size, script reads as text`, async ({ page }) => {
    const filmRequests: string[] = [];
    page.on('request', (r) => { if (r.url().includes(`/video/${c.key}-720p`)) filmRequests.push(r.url()); });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/work/${c.slug}`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(c.h1);
    await expect(page.getByText(c.label ?? 'Client Work', { exact: true }).first()).toBeVisible();
    const film = page.locator('video').first();
    await expect(film).toHaveAttribute('preload', 'none');
    await expect(film).toHaveAttribute('poster', new RegExp(`/images/${c.key}-frame-`));
    await expect(film.locator('track[kind="captions"]')).toHaveCount(1);
    await expect(film.locator('track[kind="descriptions"]')).toHaveCount(1);
    await page.waitForTimeout(800);
    expect(filmRequests).toEqual([]);

    await page.getByRole('button', { name: /^Play film/ }).click();
    await page.waitForFunction(() => { const v = document.querySelector('video'); return Boolean(v && !v.paused && v.currentTime > 0.3); }, null, { timeout: 15_000 });
    expect(await film.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    await expect(page.getByRole('button', { name: /^Play film/ })).toHaveCount(0);
    await film.evaluate((v: HTMLVideoElement) => v.pause());

    // Strategy before storyboard.
    for (const h of ['Challenge', 'Insight', 'Idea', 'Execution']) await expect(page.getByRole('heading', { name: h, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: c.board })).toBeVisible();
    await expect(page.getByText(c.firstLine, { exact: true })).toBeVisible();
    await expect(page.getByText(/To be checked against the final mix/)).toBeVisible();

    const open = page.getByRole('button', { name: /^Open image 1 of 1/ });
    await open.click();
    const viewer = page.getByRole('dialog');
    await expect(viewer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(open).toBeFocused();
  });

  test(`${c.key}: WCAG 2.2 AA scan and no overflow on a phone`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`/work/${c.slug}`, { waitUntil: 'load' });
    // Settle scroll reveals fully visible, so the scan checks every block at full opacity
    // (mid-fade text would read as low contrast; fully faded text would be skipped).
    await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
    expect(summary, summary.join('\n')).toEqual([]);
    await ctx.close();
  });
}

test('home and work list lead with the film case studies, with their running time', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#work-title').locator('xpath=ancestor::section').locator('article');
  await expect(cards).toHaveCount(3); // a featured lead and two more, filling the grid
  await expect(cards.first()).toContainText('DigitFMS');
  await expect(cards.first()).toContainText('Film 0:30');
});

test('offline edition carries both films, their storyboards and scripts', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(resolve('dist/client/downloads/weamaze-visionary.html')).href, { waitUntil: 'load' });
  for (const c of CASES) {
    const article = page.locator('article', { has: page.getByRole('heading', { name: c.h1 }) });
    const video = article.locator('video');
    expect(await video.getAttribute('src')).toMatch(/^data:video\/mp4;base64,/);
    await expect(video).toHaveAttribute('controls', '');
    expect(await video.locator('track[kind="captions"]').getAttribute('src')).toMatch(/^data:text\/vtt/);
    await expect(article.getByText(c.board).first()).toBeVisible();
    await expect(article.getByText('Script and shots')).toBeVisible();
  }
  await ctx.close();
});
