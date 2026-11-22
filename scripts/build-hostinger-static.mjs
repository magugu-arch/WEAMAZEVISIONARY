/**
 * Packages the site for Hostinger web hosting (public_html): node scripts/build-hostinger-static.mjs
 * Run after a production build (npm run build:hostinger-static does both).
 *
 * dist/hostinger-static/ then holds everything that goes into public_html:
 *   - the prerendered pages, images, films, fonts and scripts (dist/client)
 *   - .htaccess: clean page addresses, the 404 page, security headers, compression, caching.
 *     It is the only rule file outside api/: a folder with its own .htaccess is redirected by
 *     LiteSpeed to its trailing-slash address before the site's rules can answer it
 *   - api/: the PHP program that receives the forms (deploy/hostinger-static/api)
 * The security policy is taken from shared/security.ts, the same source the Node.js server uses.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERMISSIONS_POLICY, REFERRER_POLICY, headerCsp } from '../shared/security.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const client = join(root, 'dist/client');
const source = join(root, 'deploy/hostinger-static');
const out = join(root, 'dist/hostinger-static');

// Only the public site is ever packaged: a staging build hides itself from search engines
// and may contain work that is not cleared for publication.
const buildFile = join(root, 'dist/server/build.json');
const build = existsSync(buildFile) ? JSON.parse(readFileSync(buildFile, 'utf8')) : null;
if (!existsSync(join(client, 'index.html')) || build?.siteEnv !== 'production') {
  console.error('No production build found. Run "npm run build:production" first (or "npm run build:hostinger-static").');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// redirects.json and the build manifest are read by the Node.js server and build tools only.
cpSync(client, out, { recursive: true, filter: (src) => !/[\\/](redirects\.json|\.vite)$/.test(src) });
cpSync(join(source, 'api'), join(out, 'api'), { recursive: true });
rmSync(join(out, 'api/config.local.php'), { force: true }); // local test settings never ship

// Plain hosting has nowhere to send policy reports, so the two reporting directives are left out.
const csp = headerCsp({ hsts: true }).split('; ').filter((d) => !d.startsWith('report-uri') && !d.startsWith('report-to')).join('; ');
// The offline edition is sent with the policy written inside it (it pins its one inline
// script by hash, so the policy changes with every build), plus the ban on framing that a
// <meta> policy cannot carry.
const offlineFile = join(out, 'downloads/weamaze-visionary.html');
const offlineMeta = existsSync(offlineFile)
  ? readFileSync(offlineFile, 'utf8').slice(0, 20_000).match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)
  : null;
if (!offlineMeta || !offlineMeta[1].startsWith("default-src 'none'")) {
  throw new Error('The offline edition (downloads/weamaze-visionary.html) or its own security policy was not found.');
}
const offlineCsp = `${offlineMeta[1].replaceAll('&#x27;', "'")}; frame-ancestors 'none'`;
for (const value of [csp, offlineCsp, PERMISSIONS_POLICY, REFERRER_POLICY]) {
  if (/["\r\n&]/.test(value)) throw new Error('A security header contains a character that cannot be written to .htaccess.');
}
const htaccess = readFileSync(join(source, 'htaccess.template'), 'utf8')
  .replace('{{CSP}}', csp)
  .replace('{{OFFLINE_CSP}}', offlineCsp)
  .replace('{{PERMISSIONS_POLICY}}', PERMISSIONS_POLICY)
  .replace('{{REFERRER_POLICY}}', REFERRER_POLICY);
if (htaccess.includes('{{')) throw new Error('htaccess.template has a placeholder that was not filled in.');
writeFileSync(join(out, '.htaccess'), htaccess);

let files = 0;
let bytes = 0;
const misplaced = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const s = statSync(path);
    if (s.isDirectory()) walk(path);
    else {
      files += 1;
      bytes += s.size;
      const rel = relative(out, path).split(sep).join('/');
      // The year-long caching rule goes by file type, so those types may live only in assets/.
      if (/\.(js|mjs|css|woff2?)$/.test(name) && !rel.startsWith('assets/')) misplaced.push(rel);
      if (name === '.htaccess' && rel !== '.htaccess' && rel !== 'api/.htaccess') misplaced.push(rel);
    }
  }
};
walk(out);
if (misplaced.length) throw new Error(`These files do not fit the package's rules (see deploy/hostinger-static/htaccess.template): ${misplaced.join(', ')}`);
console.log(`Hostinger web hosting package: dist/hostinger-static · ${files} files · ${(bytes / 1048576).toFixed(1)} MB · upload its contents into public_html`);
