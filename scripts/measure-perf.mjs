#!/usr/bin/env node
/* global window -- used inside page.evaluate (browser context) */
/**
 * Lab performance on a throttled mobile profile (Chromium CDP): ~1.6 Mbps down,
 * 750 Kbps up, 150 ms RTT, 4× CPU slowdown, 390×844 viewport. Reports LCP,
 * CLS, FCP and transferred bytes by type. Lab data is not field data (V11.12).
 *   BASE=http://127.0.0.1:4173 node scripts/measure-perf.mjs
 */
import { chromium } from '@playwright/test';
const base = process.env.BASE ?? 'http://127.0.0.1:4173';
const routes = ['/', '/services/ai-creative-studio', '/work/digitfms-nothing-moves-unseen', '/start-a-project'];
const browser = await chromium.launch();
const rows = [];
for (const route of routes) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const bytes = {};
  cdp.on('Network.loadingFinished', (e) => { bytes[e.requestId] = { ...(bytes[e.requestId] ?? {}), size: e.encodedDataLength }; });
  cdp.on('Network.responseReceived', (e) => { bytes[e.requestId] = { ...(bytes[e.requestId] ?? {}), type: e.type, url: e.response.url }; });
  await page.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0; window.__lcpEl = '';
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element?.tagName ?? '') + (e.url ? ' ' + e.url.split('/').pop() : ''); } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  const t0 = Date.now();
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const m = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls, lcpEl: window.__lcpEl, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0 }));
  const byType = {};
  for (const b of Object.values(bytes)) if (b.size) byType[b.type ?? 'Other'] = (byType[b.type ?? 'Other'] ?? 0) + b.size;
  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  rows.push({ route, fcp: Math.round(m.fcp), lcp: Math.round(m.lcp), lcpElement: m.lcpEl, cls: Number(m.cls.toFixed(3)), totalKB: Math.round(total / 1024), ...Object.fromEntries(Object.entries(byType).map(([k, v]) => [`${k}KB`, Math.round(v / 1024)])), wall: Date.now() - t0 });
  await ctx.close();
}
await browser.close();
console.table(rows);
console.log(JSON.stringify(rows, null, 1));
