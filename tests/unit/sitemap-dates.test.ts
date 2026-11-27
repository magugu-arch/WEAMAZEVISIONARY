import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error -- plain ES module used by the build (scripts/prerender.mjs)
import { pageFingerprint, sitemapDates } from '../../scripts/sitemap-dates.mjs';

const page = ({ title = 'Work | WeAmaze Visionary', main = '<h1>Work</h1><p>Films.</p>', ld = '{"@type":"BreadcrumbList"}', script = 'index-AbC123xY', footer = 'YouTube' } = {}) =>
  `<html><head><title>${title}</title><meta name="description" content="Films and case studies." /><link rel="canonical" href="https://weamazevisionary.com/work" /><meta name="robots" content="index, follow" /><script type="module" src="/assets/${script}.js"></script><script type="application/ld+json">${ld}</script></head><body><header>Menu</header><main id="main"><img src="/assets/${script}.js" />${main}</main><footer>${footer}</footer></body></html>`;

describe('sitemap dates follow real changes only', () => {
  it('ignores what changes on every build or on every page', () => {
    const base = pageFingerprint(page());
    expect(pageFingerprint(page({ script: 'index-Zz99Qq00' }))).toBe(base); // renamed build files
    expect(pageFingerprint(page({ footer: 'YouTube LinkedIn' }))).toBe(base); // footer links
  });

  it('notices a change to what the page says', () => {
    const base = pageFingerprint(page());
    expect(pageFingerprint(page({ title: 'Our work | WeAmaze Visionary' }))).not.toBe(base);
    expect(pageFingerprint(page({ main: '<h1>Work</h1><p>Films and apps.</p>' }))).not.toBe(base);
    expect(pageFingerprint(page({ ld: '{"@type":"VideoObject"}' }))).not.toBe(base);
  });

  it('keeps a date while a page is unchanged, and dates a changed or new page today', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'wv-dates-')), 'dates.json');
    writeFileSync(file, JSON.stringify({ '/': { date: '2026-11-24', fingerprint: 'aaa' }, '/work': { date: '2026-11-24', fingerprint: 'bbb' }, '/gone': { date: '2026-11-01', fingerprint: 'ccc' } }));
    const fingerprints = new Map([['/', 'aaa'], ['/work', 'changed'], ['/new', 'ddd']]);
    const dates = sitemapDates({ file, fingerprints, today: '2026-11-27', write: false });
    expect(Object.fromEntries(dates)).toEqual({ '/': '2026-11-24', '/work': '2026-11-27', '/new': '2026-11-27' });
    expect(readFileSync(file, 'utf8')).toContain('/gone'); // a staging build never writes
    sitemapDates({ file, fingerprints, today: '2026-11-27', write: true });
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    expect(Object.keys(saved)).toEqual(['/', '/work', '/new']); // removed pages drop out
    expect(saved['/work']).toEqual({ date: '2026-11-27', fingerprint: 'changed' });
  });

  it('keeps a valid record in the project', () => {
    const file = join(process.cwd(), 'scripts/sitemap-dates.json');
    expect(existsSync(file)).toBe(true);
    const record = JSON.parse(readFileSync(file, 'utf8')) as Record<string, { date: string; fingerprint: string }>;
    expect(record['/']).toBeDefined();
    for (const [route, v] of Object.entries(record)) {
      expect(route).toMatch(/^\/[a-z0-9/-]*$/);
      expect(v.date, route).toMatch(/^2\d{3}-\d{2}-\d{2}$/);
      expect(v.fingerprint, route).toMatch(/^[0-9a-f]{16}$/);
    }
  });
});
