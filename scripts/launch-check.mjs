#!/usr/bin/env node
/**
 * Launch gate (V12.15 mandatory blockers). Reads the typed content and the
 * server environment and lists everything that still needs an owner decision.
 *   npm run launch-check                 → report (exit 0)
 *   PUBLIC_SITE_ENV=production npm run launch-check → exit 1 while any blocker is open
 */
import { createServer } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const vite = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  // Only the content modules are loaded. Without this, Vite also scans every HTML file in the
  // project for dependencies (deliverables and source files included) and prints errors
  // when the server closes before that scan ends.
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)), '@shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
});
const load = (p) => vite.ssrLoadModule(p);
const { settings } = await load('/src/content/settings.ts');
const { services } = await load('/src/content/services.ts');
const { projects } = await load('/src/content/projects.ts');
const { insights } = await load('/src/content/insights.ts');
const { legalPages } = await load('/src/content/legal.ts');
await vite.close();

const env = process.env;
const production = env.PUBLIC_SITE_ENV === 'production';
const blockers = [];
const warnings = [];
const manual = [];

for (const l of legalPages) if (!l.approved) blockers.push(`B-12 Legal page /${l.slug} is an unapproved draft`);
for (const s of services) if (s.governance.approval !== 'approved') blockers.push(`B-15 Service copy pending approval: ${s.name}`);
for (const p of projects) {
  if (p.governance.approval !== 'approved') blockers.push(`B-15 Case study copy pending approval: ${p.title}`);
  if (!p.permission.publicationApproved) blockers.push(`B-14 Publication permission not recorded: ${p.title}`);
}
for (const i of insights) if (i.governance.approval !== 'approved') blockers.push(`B-15 Article pending editorial approval: ${i.title}`);
if (!settings.contactEmail.verified) blockers.push('B-06 Public/privacy contact email not verified (settings.contactEmail.verified)');
if (!env.PUBLIC_SITE_URL) blockers.push('B-04 PUBLIC_SITE_URL not set to the confirmed canonical host');
if (!env.EMAIL_PROVIDER || env.EMAIL_PROVIDER === 'none' || env.EMAIL_PROVIDER === 'log') blockers.push('B-10 No verified transactional email provider (receipts and operator alerts)');
if (!env.OPERATOR_NOTIFICATION_EMAIL) blockers.push('B-10 OPERATOR_NOTIFICATION_EMAIL not set: nobody is alerted to new leads or failures');
if (env.BOOKING_PROVIDER === 'mock') blockers.push('B-08 BOOKING_PROVIDER=mock is development-only and is refused in production');

if (!env.BOOKING_PROVIDER || env.BOOKING_PROVIDER === 'none') warnings.push('B-08 No scheduling provider: /book-a-call offers a call request (honest fallback) instead of live booking');
if (!env.CRM_PROVIDER || env.CRM_PROVIDER === 'none') warnings.push('B-09 No CRM: leads are stored durably on the server only; the operator must review the lead store');
if (!settings.social.length) warnings.push('B-19 No verified social profiles linked');
if (env.TRUST_PROXY !== 'true') warnings.push('B-07 TRUST_PROXY not enabled: rate limiting uses the socket address (set true behind a CDN/proxy)');
if (env.FORCE_HSTS !== 'true') warnings.push('B-07 FORCE_HSTS not enabled: enable once HTTPS is confirmed on the production domain');

manual.push('B-01 Replace extracted CI artwork with the 02_LOGO_SYSTEM master files (or approve the extraction)');
manual.push('B-02/B-03 Approve the hero film master, web encodes, posters, mobile crop, loop and audio rights');
manual.push('B-05 Confirm rights/releases/provenance for all people imagery');
manual.push('B-20 Trademark search and registration through an attorney');
manual.push('Verify Google Search Console and Bing Webmaster Tools; submit the sitemap (see the SEO guide, docs/05_SEO.md)');
manual.push('Run the cross-browser checks on Safari, Firefox, Edge, iOS Safari and Android Chrome (only Chromium is tested automatically)');

const line = (s) => console.log(`  • ${s}`);
console.log(`\nWeAmaze Visionary — launch check (${production ? 'PRODUCTION' : 'report only'})\n`);
console.log(`Blockers (${blockers.length})`); blockers.forEach(line);
console.log(`\nWarnings (${warnings.length})`); warnings.forEach(line);
console.log(`\nManual sign-offs (${manual.length})`); manual.forEach(line);
console.log('');
if (production && blockers.length) {
  console.error(`✗ ${blockers.length} launch blocker(s) open. Production release is blocked.\n`);
  process.exit(1);
}
console.log(blockers.length ? '! Blockers are open (report mode, exit 0).\n' : '✓ No blockers.\n');
