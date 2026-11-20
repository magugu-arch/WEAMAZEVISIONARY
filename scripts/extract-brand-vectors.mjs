#!/usr/bin/env node
/**
 * Extracts the official WeAmaze Visionary master artwork from the vector pages
 * of the Corporate Identity Manual v1.0 (source-assets/02_ci_source/…pdf).
 *
 * Why: the supplied "Official_Vector_Assets" SVGs do not match the CI manual
 * (wrong geometry, colours and a live Arial wordmark). The manual itself embeds
 * the master artwork as outlined, filled vector paths in the exact CI colours.
 *
 * Fidelity rule: path data is copied byte-for-byte from the PDF→SVG conversion.
 * Only the viewBox is moved onto the artwork's bounds. Nothing is redrawn,
 * traced, simplified or retyped. Replace with the 02_LOGO_SYSTEM masters when
 * supplied (owner decision B-01).
 *
 * Requires poppler-utils (pdftocairo). Outputs are committed, so this only
 * needs re-running if the manual changes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pdf = join(root, 'source-assets/02_ci_source/WeAmaze_Visionary_Corporate_Identity_Manual_v1.0.pdf');
// The identity manual is kept with the studio's private source files. Without it there is
// nothing to extract from; the artwork already generated from it is part of the project.
if (!existsSync(pdf)) {
  console.error('Brand artwork is extracted from the Corporate Identity Manual, which is not in this copy of the project.\nNothing to do: the generated artwork (src/components/brand/artwork.generated.ts and public/brand) is already included.');
  process.exit(0);
}
const work = mkdtempSync(join(tmpdir(), 'wv-ci-'));

const GOLD = 'rgb(77.648926%, 63.139343%, 41.569519%)'; // #C6A16A
const ONYX = 'rgb(6.669617%, 6.669617%, 7.839966%)'; // #111114
const IVORY = 'rgb(95.689392%, 94.119263%, 90.979004%)'; // #F4F0E8

const pageCache = new Map();
function pagePaths(page) {
  if (pageCache.has(page)) return pageCache.get(page);
  const out = join(work, `p${page}.svg`);
  execFileSync('pdftocairo', ['-svg', '-f', String(page), '-l', String(page), pdf, out]);
  const src = readFileSync(out, 'utf8');
  const body = src.split('</defs>')[1];
  if (/<g[^>]*transform=/.test(body.replace(/<path[^>]*transform="[^"]*"[^>]*\/>/g, ''))) {
    throw new Error(`Page ${page}: unexpected group transform; extraction would not be exact.`);
  }
  const paths = [];
  for (const m of body.matchAll(/<path([^>]*)\/>/g)) {
    const attrs = m[1];
    if (/transform=/.test(attrs) || / stroke="/.test(attrs)) continue; // frame strokes only
    const fill = attrs.match(/ fill="([^"]*)"/)?.[1];
    const d = attrs.match(/ d="([^"]*)"/)?.[1];
    if (!fill || !d) continue;
    const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((x) => Number(x[0]));
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    paths.push({ fill, d: d.trim(), bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
  }
  pageCache.set(page, paths);
  return paths;
}

/** Select paths of a colour whose bbox lies inside a page-space rectangle. */
function pick(page, fill, [x0, y0, x1, y1]) {
  const found = pagePaths(page).filter(
    (p) => p.fill === fill && p.bbox[0] >= x0 && p.bbox[1] >= y0 && p.bbox[2] <= x1 && p.bbox[3] <= y1,
  );
  if (!found.length) throw new Error(`No ${fill} artwork on page ${page} inside ${[x0, y0, x1, y1]}`);
  return found;
}

function union(paths) {
  const b = paths.map((p) => p.bbox);
  return [Math.min(...b.map((v) => v[0])), Math.min(...b.map((v) => v[1])), Math.max(...b.map((v) => v[2])), Math.max(...b.map((v) => v[3]))];
}
const r = (n) => Math.round(n * 1000) / 1000;
function viewBoxOf(paths, pad = 0) {
  const [x0, y0, x1, y1] = union(paths);
  return [r(x0 - pad), r(y0 - pad), r(x1 - x0 + 2 * pad), r(y1 - y0 + 2 * pad)];
}
function squareViewBox(paths, size) {
  const [x0, y0, x1, y1] = union(paths);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [r(cx - size / 2), r(cy - size / 2), r(size), r(size)];
}

// ---- Artwork definitions (page numbers and rectangles from the CI manual) ----
const assets = {};
// §10 Standalone monogram, page 12: primary, compact, micro weights (Gold on Onyx tiles)
assets.monogramPrimary = { mark: pick(12, GOLD, [36, 161, 281, 364]) };
assets.monogramCompact = { mark: pick(12, GOLD, [298, 161, 543, 364]) };
assets.monogramMicro = { mark: pick(12, GOLD, [560, 161, 806, 364]) };
// §05 Primary logo, page 7: Gold monogram above Onyx two-line wordmark
assets.logoPrimary = { mark: pick(7, GOLD, [36, 52, 531, 554]), word: pick(7, ONYX, [140, 360, 430, 445]) };
// §07 Horizontal lockup, page 9: primary weight (light) and compact weight (light)
assets.horizontalPrimary = { mark: pick(9, GOLD, [36, 161, 412, 334]), word: pick(9, ONYX, [36, 161, 412, 334]) };
assets.horizontalCompact = { mark: pick(9, GOLD, [36, 368, 412, 481]), word: pick(9, ONYX, [36, 368, 412, 481]) };
// Reversed versions on the same page, used to verify the geometry is identical
const horizontalPrimaryReversed = { mark: pick(9, GOLD, [430, 161, 806, 334]), word: pick(9, IVORY, [430, 161, 806, 334]) };
const horizontalCompactReversed = { mark: pick(9, GOLD, [430, 368, 806, 481]), word: pick(9, IVORY, [430, 368, 806, 481]) };

// §20 Iconography, page 25: eight service icons (Onyx), drawn at a common scale.
const iconTiles = {
  'ai-creative-studio': [36, 119, 150, 208],
  'ai-presentations-pitch-decks': [160, 119, 274, 208],
  'websites-digital-experiences': [284, 119, 399, 208],
  'apps-digital-products': [408, 119, 523, 208],
  'ai-solutions-automation': [36, 263, 150, 352],
  '3d-animation-motion-design': [160, 263, 274, 352],
  'brand-strategy-creative-direction': [284, 263, 399, 352],
  'digital-innovation-technology': [408, 263, 523, 352],
};
const icons = {};
for (const [slug, rect] of Object.entries(iconTiles)) icons[slug] = pick(25, ONYX, rect);
// Common 24-unit grid box: tallest icon spans the 20-unit live area (2..22 of 24).
const tallest = Math.max(...Object.values(icons).map((p) => { const b = union(p); return Math.max(b[2] - b[0], b[3] - b[1]); }));
const iconBox = (tallest * 24) / 20;

// ---- Verify reversed artwork shares the light artwork's geometry (translated) ----
function shapeSignature(paths) {
  return paths.map((p) => p.d.replace(/-?\d+(?:\.\d+)?/g, '#')).join('|') + `@${paths.length}`;
}
for (const [a, b, name] of [
  [assets.horizontalPrimary, horizontalPrimaryReversed, 'horizontal primary'],
  [assets.horizontalCompact, horizontalCompactReversed, 'horizontal compact'],
]) {
  if (shapeSignature([...a.mark, ...a.word]) !== shapeSignature([...b.mark, ...b.word])) {
    console.warn(`! ${name}: reversed artwork command structure differs from light artwork`);
  } else console.log(`✓ ${name}: reversed artwork matches light artwork structure`);
}

// ---- Emit TypeScript module ----
const ts = [];
ts.push('/* eslint-disable */');
ts.push('// GENERATED by scripts/extract-brand-vectors.mjs — do not edit by hand.');
ts.push('// Source: WeAmaze_Visionary_Corporate_Identity_Manual_v1.0.pdf (vector pages 7, 9, 12, 25).');
ts.push('// Path data is byte-identical to the manual; only the viewBox is set to the artwork bounds.');
ts.push('export type ArtworkPath = { readonly d: string; readonly role: "mark" | "word" };');
ts.push('export type Artwork = { readonly viewBox: string; readonly width: number; readonly height: number; readonly paths: readonly ArtworkPath[] };');
const emit = (name, a) => {
  const all = [...a.mark, ...(a.word ?? [])];
  const vb = viewBoxOf(all);
  const list = [...a.mark.map((p) => ({ d: p.d, role: 'mark' })), ...(a.word ?? []).map((p) => ({ d: p.d, role: 'word' }))];
  ts.push(`export const ${name}: Artwork = ${JSON.stringify({ viewBox: vb.join(' '), width: vb[2], height: vb[3], paths: list })};`);
  return { vb, list };
};
const emitted = {};
for (const [k, v] of Object.entries(assets)) emitted[k] = emit(k, v);
ts.push('export const serviceIcons = {');
for (const [slug, p] of Object.entries(icons)) {
  const vb = squareViewBox(p, iconBox);
  ts.push(`  ${JSON.stringify(slug)}: ${JSON.stringify({ viewBox: vb.join(' '), width: vb[2], height: vb[3], paths: p.map((x) => ({ d: x.d, role: 'mark' })) })},`);
}
ts.push('} as const satisfies Record<string, Artwork>;');
ts.push('export type ServiceIconSlug = keyof typeof serviceIcons;');
mkdirSync(join(root, 'src/components/brand'), { recursive: true });
writeFileSync(join(root, 'src/components/brand/artwork.generated.ts'), ts.join('\n') + '\n');

// ---- Emit standalone SVG files (CI file naming: WV_Asset_Variant_Colour.svg) ----
const C = { gold: '#C6A16A', onyx: '#111114', ivory: '#F4F0E8', white: '#FFFFFF' };
const outDir = join(root, 'public/brand');
mkdirSync(outDir, { recursive: true });
function svgFile(file, title, { vb, list }, colours) {
  const body = list.map((p) => `<path fill="${colours[p.role]}" d="${p.d}"/>`).join('');
  writeFileSync(join(outDir, file), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`);
}
const name = 'WeAmaze Visionary';
svgFile('WV_Monogram_Primary_Gold.svg', `${name} monogram`, emitted.monogramPrimary, { mark: C.gold });
svgFile('WV_Monogram_Compact_Gold.svg', `${name} monogram`, emitted.monogramCompact, { mark: C.gold });
svgFile('WV_Monogram_Micro_Gold.svg', `${name} monogram`, emitted.monogramMicro, { mark: C.gold });
svgFile('WV_Monogram_Micro_Onyx.svg', `${name} monogram`, emitted.monogramMicro, { mark: C.onyx });
svgFile('WV_Logo_Primary_Light.svg', name, emitted.logoPrimary, { mark: C.gold, word: C.onyx });
svgFile('WV_Logo_Primary_Reversed.svg', name, emitted.logoPrimary, { mark: C.gold, word: C.ivory });
svgFile('WV_Logo_Horizontal_Light.svg', name, emitted.horizontalPrimary, { mark: C.gold, word: C.onyx });
svgFile('WV_Logo_Horizontal_Reversed.svg', name, emitted.horizontalPrimary, { mark: C.gold, word: C.ivory });
svgFile('WV_Logo_Horizontal_Compact_Light.svg', name, emitted.horizontalCompact, { mark: C.gold, word: C.onyx });
svgFile('WV_Logo_Horizontal_Compact_Reversed.svg', name, emitted.horizontalCompact, { mark: C.gold, word: C.ivory });

// Favicon: micro weight, Onyx on light themes and Gold on dark themes (CI §22).
const micro = emitted.monogramMicro;
const pad = micro.vb[2] * 0.06;
const side = Math.max(micro.vb[2], micro.vb[3]) + pad * 2;
const fx = micro.vb[0] + micro.vb[2] / 2 - side / 2, fy = micro.vb[1] + micro.vb[3] / 2 - side / 2;
writeFileSync(join(outDir, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(fx)} ${r(fy)} ${r(side)} ${r(side)}"><style>path{fill:${C.onyx}}@media (prefers-color-scheme:dark){path{fill:${C.gold}}}</style>${micro.list.map((p) => `<path d="${p.d}"/>`).join('')}</svg>\n`);

// Provenance record
writeFileSync(join(outDir, 'PROVENANCE.md'), `# Brand artwork provenance\n\nExtracted ${new Date().toISOString().slice(0, 10)} by \`scripts/extract-brand-vectors.mjs\` from the vector pages of\n\`WeAmaze_Visionary_Corporate_Identity_Manual_v1.0.pdf\` (pages 7, 9, 12, 25).\nPath data is byte-identical to the manual. Only the viewBox was set to the artwork bounds,\nand colours were assigned per CI §05/§08/§10. Replace with the \`02_LOGO_SYSTEM\` masters when\nthey are supplied. Clear space (X = one quarter of the monogram height) is applied in layout,\nnot baked into these files.\n`);

rmSync(work, { recursive: true, force: true });
console.log('Icon grid box (pt):', r(iconBox));
for (const [k, v] of Object.entries(emitted)) console.log(k, 'viewBox', v.vb.join(' '), 'ratio', r(v.vb[2] / v.vb[3]));
