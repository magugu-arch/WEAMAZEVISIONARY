import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/**
 * Parallax (V10 §12): media and motifs drift inside fixed frames; text never moves;
 * at most three media moments per page; nothing moves under reduced motion.
 */
const OFFLINE = pathToFileURL(resolve('dist/client/downloads/weamaze-visionary.html')).href;
const ROUTES = ['/', '/services/ai-creative-studio', '/approach', '/studio', '/insights', '/insights/before-you-brief-a-creative-technology-studio'];

const layerY = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => {
  const t = getComputedStyle(el).translate;
  if (t === 'none') return 0;
  const y = t.split(' ')[1] ?? '0px';
  return y.endsWith('%') ? (parseFloat(y) / 100) * (el as HTMLElement).offsetHeight : parseFloat(y);
});
const scrollFrameTo = (page: Page, sel: string, fraction: number) => page.locator(sel).first().evaluate((el, f) => {
  const frame = el.closest('[data-parallax-frame]')!;
  const r = frame.getBoundingClientRect();
  // fraction 0 → frame just entering at the bottom; 1 → just leaving at the top
  const y = window.scrollY + r.top - window.innerHeight + f * (window.innerHeight + r.height);
  window.scrollTo(0, Math.max(0, y));
}, fraction);

test('a few media moments per page, never text, and frames never change size', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax-layer]'));
      return {
        media: layers.filter((l) => l.dataset.parallaxLayer !== 'motif').length,
        withText: layers.filter((l) => (l.textContent ?? '').trim().length > 0).length,
        orphan: layers.filter((l) => !l.parentElement?.closest('[data-parallax-frame]')).length,
      };
    });
    expect(info.media, route).toBeGreaterThanOrEqual(1);
    expect(info.media, route).toBeLessThanOrEqual(3);
    expect(info.withText, route).toBe(0);
    expect(info.orphan, route).toBe(0);
  }
});

test('desktop: media drift with scroll inside a fixed frame; the hero film eases away', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  const media = '[data-parallax-layer="media"]';
  const frameBox = () => page.locator(media).first().evaluate((el) => { const r = el.closest('[data-parallax-frame]')!.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  const before = await frameBox();
  await scrollFrameTo(page, media, 0.1);
  await page.waitForTimeout(200);
  const early = await layerY(page, media);
  await scrollFrameTo(page, media, 0.9);
  await page.waitForTimeout(200);
  const late = await layerY(page, media);
  expect(late - early).toBeGreaterThan(40); // drifts down relative to the frame: reads as depth
  expect(Math.abs(early)).toBeLessThanOrEqual(44.5);
  expect(Math.abs(late)).toBeLessThanOrEqual(44.5); // clamped to the overscan, so no edge shows
  expect(await frameBox()).toEqual(before);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  expect(await layerY(page, '[data-parallax-layer="hero"]')).toBeCloseTo(0, 0);
  await page.evaluate(() => window.scrollTo(0, 450));
  await page.waitForTimeout(200);
  const hero = await layerY(page, '[data-parallax-layer="hero"]');
  expect(hero).toBeGreaterThan(60);
  expect(hero).toBeLessThan(450); // slower than the page: the film recedes
  // Copy does not move with it.
  const copyTop = await page.locator('[data-hero-copy]').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  expect(await page.locator('[data-hero-copy]').evaluate((el) => el.getBoundingClientRect().top + window.scrollY)).toBeCloseTo(copyTop, 0);
});

test('motifs drift inside their own lanes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/studio', { waitUntil: 'load' });
  const motif = '[data-parallax-layer="motif"]';
  await scrollFrameTo(page, motif, 0.2);
  await page.waitForTimeout(200);
  const a = await layerY(page, motif);
  await scrollFrameTo(page, motif, 0.8);
  await page.waitForTimeout(200);
  const b = await layerY(page, motif);
  expect(b).toBeGreaterThan(a);
});

test('reduced motion: nothing drifts and media sit flush in their frames', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const route of ['/', '/studio']) {
    await page.goto(route, { waitUntil: 'load' });
    for (const y of [0, 600, 1800, 3200]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(120);
      const moved = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-parallax-layer]')).filter((l) => {
        const cs = getComputedStyle(l);
        const frame = l.closest('[data-parallax-frame]')!.getBoundingClientRect();
        const r = l.getBoundingClientRect();
        return cs.translate !== 'none' || cs.animationName !== 'none' || (l.dataset.parallaxLayer !== 'motif' && Math.abs(r.height - frame.height) > 1);
      }).length);
      expect(moved, `${route} @${y}`).toBe(0);
    }
  }
  await ctx.close();
});

test('offline edition: parallax runs on CSS alone, with JavaScript off', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(OFFLINE, { waitUntil: 'load' });
  const media = '[data-parallax-layer="media"]';
  await scrollFrameTo(page, media, 0.1);
  await page.waitForTimeout(200);
  const a = await layerY(page, media);
  await scrollFrameTo(page, media, 0.9);
  await page.waitForTimeout(200);
  expect((await layerY(page, media)) - a).toBeGreaterThan(40);
  await ctx.close();
});

test('fallback without CSS scroll timelines: rAF drives the same drift on precise pointers', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const orig = CSS.supports.bind(CSS);
    CSS.supports = ((a: string, b?: string) => (/animation-timeline/.test(b === undefined ? a : `${a}:${b}`) ? false : b === undefined ? orig(a) : orig(a, b))) as typeof CSS.supports;
  });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  await page.addStyleTag({ content: '[data-parallax-layer]{animation:none!important}' });
  const media = '[data-parallax-layer="media"]';
  await scrollFrameTo(page, media, 0.1);
  await page.waitForTimeout(250);
  const a = await layerY(page, media);
  await scrollFrameTo(page, media, 0.9);
  await page.waitForTimeout(250);
  const b = await layerY(page, media);
  expect(b - a).toBeGreaterThan(40);
  expect(Math.abs(b)).toBeLessThanOrEqual(44.5);
  await ctx.close();
});
