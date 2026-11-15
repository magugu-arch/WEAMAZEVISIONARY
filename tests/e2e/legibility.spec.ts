import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/**
 * Legibility: text is never drawn over a motif, image or film, except the home
 * hero copy at lg+, which sits on a calibrated scrim and is measured instead.
 *
 * 1. Overlap: every visible text box is tested against every graphic's *painted*
 *    box (its rect clipped by overflow and clip-path ancestors). Controls with
 *    their own near-opaque background (film pause, gallery arrows) are allowed.
 * 2. Contrast: the hero film is replaced by pure white (the worst case; the film
 *    contains near-white frames), the copy is made transparent, and the brightest
 *    pixel under each line of text must still give ≥ 4.5:1.
 */
const OFFLINE = pathToFileURL(resolve('dist/client/downloads/weamaze-visionary.html')).href;
const ROUTES = ['/', '/services', '/services/ai-creative-studio', '/work/digitfms-nothing-moves-unseen', '/work/miss-rhee-beauty-the-space-of-restoration', '/work/my-backyard', '/approach', '/studio', '/insights', '/insights/before-you-brief-a-creative-technology-studio'];
const WIDTHS = [390, 768, 1024, 1280, 1440];

async function textOverGraphics(page: Page) {
  return page.evaluate(() => {
    type Box = { l: number; t: number; r: number; b: number };
    const clipBox = (el: Element): Box | null => {
      const r0 = el.getBoundingClientRect();
      let box: Box = { l: r0.left, t: r0.top, r: r0.right, b: r0.bottom };
      for (let a: Element | null = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        const ar = a.getBoundingClientRect();
        let c: Box | null = null;
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') c = { l: cs.overflowX === 'visible' ? -1e9 : ar.left, t: cs.overflowY === 'visible' ? -1e9 : ar.top, r: cs.overflowX === 'visible' ? 1e9 : ar.right, b: cs.overflowY === 'visible' ? 1e9 : ar.bottom };
        const m = /^inset\(([^)]*)\)$/.exec(cs.clipPath);
        if (m) {
          const v = m[1]!.trim().split(/\s+/).map((x) => (x.endsWith('vw') ? (parseFloat(x) * innerWidth) / 100 : parseFloat(x)));
          const [t = 0, rr = t, bb = t, ll = rr] = v;
          const k = { l: ar.left + ll, t: ar.top + t, r: ar.right - rr, b: ar.bottom - bb };
          c = c ? { l: Math.max(c.l, k.l), t: Math.max(c.t, k.t), r: Math.min(c.r, k.r), b: Math.min(c.b, k.b) } : k;
        }
        if (c) box = { l: Math.max(box.l, c.l), t: Math.max(box.t, c.t), r: Math.min(box.r, c.r), b: Math.min(box.b, c.b) };
        if (box.r - box.l <= 0 || box.b - box.t <= 0) return null;
      }
      return box;
    };
    const alphaOf = (c: string) => {
      if (c === 'transparent') return 0;
      const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(c);
      if (slash) return parseFloat(slash[1]!) / (slash[2] ? 100 : 1);
      const rgba = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/.exec(c);
      return rgba ? parseFloat(rgba[1]!) : 1;
    };
    // A control with its own ≥ 80% background reads on that background, not on the media.
    const opaqueBg = (el: Element) => {
      for (let a: Element | null = el; a && a.tagName !== 'SECTION' && a !== document.body; a = a.parentElement) {
        if (alphaOf(getComputedStyle(a).backgroundColor) >= 0.8) return true;
      }
      return false;
    };
    const graphics = Array.from(document.querySelectorAll('main svg[aria-hidden="true"], main img, main video'))
      .map((g) => ({ g, box: clipBox(g) }))
      .filter((x): x is { g: Element; box: Box } => Boolean(x.box) && x.box!.r - x.box!.l > 24 && x.box!.b - x.box!.t > 24 && getComputedStyle(x.g).visibility !== 'hidden' && getComputedStyle(x.g).display !== 'none');
    const hits: string[] = [];
    const walker = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent?.trim() || !el) continue;
      if (el.closest('[aria-hidden="true"], .sr-only, [data-hero-copy]')) continue;
      const det = el.closest('details');
      if (det && !det.open && !el.closest('summary')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
      if (opaqueBg(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const tr of Array.from(range.getClientRects())) {
        if (tr.width < 2) continue;
        for (const { g, box } of graphics) {
          if (g.contains(el)) continue;
          const ix = Math.min(tr.right, box.r) - Math.max(tr.left, box.l);
          const iy = Math.min(tr.bottom, box.b) - Math.max(tr.top, box.t);
          if (ix > 1 && iy > 1) hits.push(`"${n.textContent.trim().slice(0, 40)}" over <${g.tagName.toLowerCase()} class="${(g.getAttribute('class') ?? '').slice(0, 50)}">`);
        }
      }
    }
    return [...new Set(hits)];
  });
}

const settle = (page: Page) => page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important}' });

test.describe('no text over motifs, images or film', () => {
  for (const width of WIDTHS) {
    test(`site at ${width}px`, async ({ browser }) => {
      test.setTimeout(120_000);
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const failures: string[] = [];
      for (const route of ROUTES) {
        await page.goto(route, { waitUntil: 'load' });
        await settle(page);
        for (const hit of await textOverGraphics(page)) failures.push(`${route}: ${hit}`);
      }
      expect(failures).toEqual([]);
      await page.close();
    });
  }

  test('offline edition at every width, JavaScript on and off', async ({ browser }) => {
    test.setTimeout(120_000);
    const failures: string[] = [];
    for (const js of [true, false]) {
      for (const width of [320, ...WIDTHS, 1920]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: js });
        const page = await ctx.newPage();
        await page.goto(OFFLINE, { waitUntil: 'load' });
        for (const hit of await textOverGraphics(page)) failures.push(`${width}px js:${js}: ${hit}`);
        await ctx.close();
      }
    }
    expect(failures).toEqual([]);
  });
});

/** Worst-case contrast of text over the hero: film replaced by white, copy hidden, brightest pixel per line. */
async function worstContrast(page: Page, selector: string) {
  const lines = await page.evaluate((sel) => {
    const rel = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const out: { text: string; x: number; y: number; w: number; h: number; lum: number }[] = [];
    const opaque = (el: Element) => {
      for (let a: Element | null = el; a && !a.matches(sel); a = a.parentElement) {
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(a).backgroundColor);
        if (m) { const p = m[1]!.split(/[\s,/]+/).filter(Boolean); if ((p.length > 3 ? parseFloat(p[3]!) : 1) > 0.5) return true; }
      }
      return false;
    };
    for (const root of Array.from(document.querySelectorAll(sel))) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || !n.textContent?.trim() || el.closest('.sr-only') || opaque(el)) continue;
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).color)!;
        const [r, g, b] = m[1]!.split(/[\s,/]+/).map(Number) as [number, number, number];
        const lum = 0.2126 * rel(r) + 0.7152 * rel(g) + 0.0722 * rel(b);
        const range = document.createRange();
        range.selectNodeContents(n);
        // Lines scrolled under the fixed header are occluded by it, not read over the film.
        const top = el.closest('header') ? 0 : (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
        for (const rc of Array.from(range.getClientRects())) {
          const y = Math.max(rc.top, top);
          if (rc.width > 2 && rc.bottom - y > 4 && y < innerHeight) out.push({ text: n.textContent.trim().slice(0, 30), x: rc.left, y, w: rc.width, h: rc.bottom - y, lum });
        }
      }
    }
    return out;
  }, selector);
  // Hide all text (keeps layout), then screenshot what sits behind it.
  await page.addStyleTag({ content: `${selector}, ${selector} * { color: transparent !important; text-decoration-color: transparent !important; } ${selector} svg { visibility: hidden !important; }` });
  const shot = (await page.screenshot()).toString('base64');
  const probe = await page.context().newPage();
  const results = await probe.evaluate(async ({ shot, lines }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${shot}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const rel = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return lines.map((l) => {
      const x = Math.max(0, Math.floor(l.x)), y = Math.max(0, Math.floor(l.y));
      const w = Math.min(c.width - x, Math.ceil(l.w)), h = Math.min(c.height - y, Math.ceil(l.h));
      const d = ctx.getImageData(x, y, w, h).data;
      let max = 0;
      for (let i = 0; i < d.length; i += 4) max = Math.max(max, 0.2126 * rel(d[i]!) + 0.7152 * rel(d[i + 1]!) + 0.0722 * rel(d[i + 2]!));
      const ratio = (Math.max(l.lum, max) + 0.05) / (Math.min(l.lum, max) + 0.05);
      return { text: l.text, ratio: Math.round(ratio * 100) / 100 };
    });
  }, { shot, lines });
  await probe.close();
  return results;
}

const whiteFilm = '[data-parallax-layer="hero"] { background: #fff !important; } [data-parallax-layer="hero"] > * { visibility: hidden !important; }';

test.describe('hero copy holds 4.5:1 over the worst possible film frame', () => {
  for (const [w, h] of [[1024, 768], [1280, 720], [1366, 640], [1440, 900], [1920, 1080]] as const) {
    for (const scroll of [0, 160]) {
      test(`${w}×${h}, scrolled ${scroll}px`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const page = await ctx.newPage();
        await page.goto('/', { waitUntil: 'load' });
        await page.addStyleTag({ content: whiteFilm });
        await page.evaluate((y) => window.scrollTo(0, y), scroll);
        await page.waitForTimeout(250);
        const res = await worstContrast(page, scroll === 0 ? '[data-hero-copy], header' : '[data-hero-copy]');
        expect(res.length).toBeGreaterThan(4);
        test.info().annotations.push({ type: 'contrast', description: JSON.stringify(res) });
        const weak = res.filter((r) => r.ratio < 4.5);
        expect(weak, JSON.stringify(res)).toEqual([]);
        await ctx.close();
      });
    }
  }

  test('below lg the copy sits under the film on plain Onyx; header holds 4.5:1 over a white frame', async ({ browser }) => {
    for (const [w, h] of [[390, 844], [768, 1024]] as const) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto('/', { waitUntil: 'load' });
      const film = await page.locator('[data-parallax-layer="hero"]').evaluate((el) => el.closest('[data-parallax-frame]')!.getBoundingClientRect().bottom);
      const copyTop = await page.locator('[data-hero-copy]').evaluate((el) => el.getBoundingClientRect().top);
      expect(copyTop).toBeGreaterThanOrEqual(film);
      await page.addStyleTag({ content: whiteFilm });
      const res = await worstContrast(page, 'header');
      expect(res.filter((r) => r.ratio < 4.5), JSON.stringify(res)).toEqual([]);
      await ctx.close();
    }
  });
});
