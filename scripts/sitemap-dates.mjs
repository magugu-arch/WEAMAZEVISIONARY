/**
 * Sitemap dates that tell the truth.
 *
 * Google reads a page's <lastmod> only while the site's dates prove accurate; a site that
 * stamps every page with the build date teaches it to ignore them. So each page's date moves
 * only when what the page says changes: its title, description, canonical address, robots
 * rule, structured data or main content. The header, the footer and the build's file names
 * are left out, as Google's guidance asks (a footer link is not an update to a page).
 *
 * The dates live in scripts/sitemap-dates.json, which production builds update and which is
 * committed with the change that moved them. Staging builds read it and never write it.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** What a page says, without the parts that change on every build or on every page. */
export function pageFingerprint(html) {
  const pick = (re) => html.match(re)?.[1] ?? '';
  const parts = [
    pick(/<title>([\s\S]*?)<\/title>/),
    pick(/<meta name="description" content="([^"]*)"/),
    pick(/<link rel="canonical" href="([^"]*)"/),
    pick(/<meta name="robots" content="([^"]*)"/),
    ...[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    pick(/<main\b[^>]*>([\s\S]*)<\/main>/),
  ];
  // Built files are renamed whenever their contents change (/assets/name-HASH.ext).
  const text = parts.join('\n\u0000\n').replace(/\/assets\/([\w.-]+?)-[\w-]{8}\.(\w+)/g, '/assets/$1.$2');
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Dates for the sitemap: a page keeps its recorded date while its fingerprint is unchanged;
 * a new or changed page takes today's. With `write`, the record is updated on disk.
 */
export function sitemapDates({ file, fingerprints, today, write }) {
  const known = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const next = {};
  for (const [route, fingerprint] of fingerprints) {
    const prev = known[route];
    next[route] = prev && prev.fingerprint === fingerprint ? prev : { date: today, fingerprint };
  }
  const body = `${JSON.stringify(next, null, 2)}\n`;
  if (write && (!existsSync(file) || readFileSync(file, 'utf8') !== body)) writeFileSync(file, body);
  return new Map(Object.entries(next).map(([route, v]) => [route, v.date]));
}
