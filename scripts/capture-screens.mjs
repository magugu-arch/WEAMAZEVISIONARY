#!/usr/bin/env node
/**
 * Responsive visual QA capture (V12.14 matrix). Run against a running build:
 *   BASE=http://127.0.0.1:4173 node scripts/capture-screens.mjs
 * Writes JPEGs to docs/qa/screens/.
 */
/* global document, window -- used inside page.evaluate (browser context) */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const base = process.env.BASE ?? 'http://127.0.0.1:4173';
const out = new URL('../docs/qa/screens/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
const templates = ['/services', '/services/ai-presentations-pitch-decks', '/work', '/work/digitfms-nothing-moves-unseen', '/work/miss-rhee-beauty-the-space-of-restoration', '/work/my-backyard', '/approach', '/studio', '/insights', '/insights/before-you-brief-a-creative-technology-studio', '/start-a-project', '/book-a-call', '/contact', '/privacy', '/does-not-exist'];
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '_'));

const browser = await chromium.launch();
async function shot(name, path, { width, height = 900, full = false, reduced = false, action } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference', timezoneId: 'Europe/London' });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (full) {
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(400);
  }
  if (action) await action(page);
  await page.screenshot({ path: `${out}${name}.jpg`, type: 'jpeg', quality: 72, fullPage: full });
  await ctx.close();
}
for (const w of widths) await shot(`home_first-viewport_${w}`, '/', { width: w, height: w < 768 ? 812 : w <= 1024 ? 768 : 900 });
await shot('home_full_390', '/', { width: 390, height: 844, full: true });
await shot('home_full_1440', '/', { width: 1440, full: true });
await shot('home_reduced-motion_1440', '/', { width: 1440, reduced: true });
await shot('home_short-landscape_844x390', '/', { width: 844, height: 390 });
for (const p of templates) {
  await shot(`${slug(p)}_full_390`, p, { width: 390, height: 844, full: true });
  await shot(`${slug(p)}_full_1440`, p, { width: 1440, full: true });
}
await shot('state_mobile-menu-open_390', '/', { width: 390, height: 844, action: (p) => p.getByRole('button', { name: 'Menu' }).click().then(() => p.waitForTimeout(600)) });
await shot('state_services-dropdown_1440', '/services', { width: 1440, action: (p) => p.getByRole('button', { name: 'Services', exact: true }).click().then(() => p.waitForTimeout(300)) });
await shot('state_builder-validation-error_1440', '/start-a-project', { width: 1440, action: (p) => p.getByRole('button', { name: 'Continue' }).click().then(() => p.waitForTimeout(300)) });
await shot('state_gallery-open_1440', '/work/digitfms-nothing-moves-unseen', { width: 1440, action: (p) => p.getByRole('button', { name: /Open image 2 of 6/ }).click().then(() => p.waitForTimeout(600)) });
await shot('state_work-filter-empty_1440', '/work?service=3d-animation-motion-design&status=capability-demonstration', { width: 1440 });

// Legibility and parallax evidence.
const toEl = (sel, offset = 160) => (p) => p.evaluate(([s, o]) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - o); }, [sel, offset]).then(() => p.waitForTimeout(500));
const seekFilm = (t) => async (p) => {
  await p.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 2; }, null, { timeout: 15000 });
  await p.evaluate(async (time) => { const v = document.querySelector('video'); v.pause(); v.currentTime = time; await new Promise((r) => v.addEventListener('seeked', r, { once: true })); }, t);
  await p.waitForTimeout(400);
};
await shot('legibility_hero-on-film_1440', '/', { width: 1440, action: seekFilm(4.6) });
await shot('legibility_hero-on-film_1920', '/', { width: 1920, height: 1080, action: seekFilm(2.0) });
const openFilm = async (p) => { await p.getByRole('button', { name: /^Watch the film/ }).click(); await p.waitForFunction(() => { const v = document.querySelector('dialog[open] video'); return v && v.currentTime > 5; }, null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(400); };
await shot('state_film-player-open_1440', '/', { width: 1440, action: openFilm });
await shot('state_film-player-open_390', '/', { width: 390, height: 844, action: openFilm });
await shot('legibility_hero-white-worst-case_1440', '/', { width: 1440, action: (p) => p.addStyleTag({ content: '[data-parallax-layer="hero"]{background:#fff!important}[data-parallax-layer="hero"]>*{visibility:hidden!important}' }).then(() => p.waitForTimeout(200)) });
await shot('legibility_statement-lane_1440', '/', { width: 1440, action: toEl('#statement-title', 200) });
await shot('legibility_cta-lane_390', '/', { width: 390, height: 844, action: toEl('#closing-cta', 200) });
await shot('legibility_cta-lane_768', '/', { width: 768, height: 1024, action: toEl('#closing-cta', 200) });
await shot('legibility_cta-lane_1024', '/', { width: 1024, height: 768, action: toEl('#closing-cta', 140) });
await shot('legibility_cta-lane_1440', '/', { width: 1440, action: toEl('#closing-cta', 200) });
await shot('legibility_studio-philosophy-lane_1440', '/studio', { width: 1440, action: toEl('#philosophy-title', 160) });
const frameAt = (sel, f) => (p) => p.evaluate(([s, fr]) => { const e = document.querySelector(s).closest('[data-parallax-frame]'); const r = e.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - window.innerHeight + fr * (window.innerHeight + r.height)); }, [sel, f]).then(() => p.waitForTimeout(400));
await shot('parallax_studio-image-entering_1440', '/studio', { width: 1440, action: frameAt('[data-parallax-layer="media"]', 0.35) });
await shot('parallax_studio-image-leaving_1440', '/studio', { width: 1440, action: frameAt('[data-parallax-layer="media"]', 0.75) });

// Offline edition, opened from disk.
const offline = pathToFileURL(new URL('../dist/client/downloads/weamaze-visionary.html', import.meta.url).pathname).href;
async function offlineShot(name, { width, height, full = false, action, mobile = false }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(offline, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  if (action) await action(page);
  await page.screenshot({ path: `${out}${name}.jpg`, type: 'jpeg', quality: 72, fullPage: full });
  await ctx.close();
}
await offlineShot('offline-edition_iphone_first-viewport', { width: 390, height: 844, mobile: true });
await offlineShot('offline-edition_android_first-viewport', { width: 412, height: 915, mobile: true });
await offlineShot('offline-edition_iphone_full_390', { width: 390, height: 844, mobile: true, full: true });
await offlineShot('offline-edition_next-steps-lane_390', { width: 390, height: 844, mobile: true, action: toEl('#next-title', 150) });
await offlineShot('offline-edition_next-steps-lane_1440', { width: 1440, height: 900, action: toEl('#next-title', 200) });

await browser.close();
console.log('Screens written to', out);
