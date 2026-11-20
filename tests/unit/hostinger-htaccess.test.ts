import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The address rules for Hostinger web hosting (deploy/hostinger-static/htaccess.template).
 * Their order matters: LiteSpeed adds a slash to a folder's address by itself, so a folder
 * must be answered before the rule that removes trailing slashes, or the two redirect to each
 * other for ever (found on the live site, 20 November 2026). The behaviour itself is tested
 * in a browser by tests/e2e-hostinger.
 */
const template = readFileSync(new URL('../../deploy/hostinger-static/htaccess.template', import.meta.url), 'utf8');
const rules = template.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('Rewrite'));
const at = (needle: string) => rules.findIndex((l) => l.includes(needle));

describe('Hostinger web hosting address rules', () => {
  it('answers a folder with no page before the trailing-slash redirect, and never redirects it', () => {
    const folder = at('/__not-found');
    const slash = at('R=301,L,NE]');
    expect(folder).toBeGreaterThan(-1);
    expect(rules[folder]).toBe('RewriteRule ^ /__not-found [L]');
    expect(rules[folder - 2]).toBe('RewriteCond %{REQUEST_FILENAME} -d');
    expect(rules[folder - 1]).toBe('RewriteCond %{REQUEST_FILENAME}/index.html !-f');
    const stripSlash = rules.findIndex((l) => l === 'RewriteRule ^ /%1 [R=301,L,NE]');
    expect(stripSlash).toBeGreaterThan(folder);
    expect(slash).toBeLessThan(folder); // the only redirect before it is www to the bare domain
    expect(rules[slash]).toContain('https://%1%{REQUEST_URI}');
  });

  it('sends the forms to the PHP program before any page rule', () => {
    expect(at('api/index.php [L]')).toBeLessThan(at('/__not-found'));
  });

  it('leaves no placeholder behind except the three the build fills in', () => {
    expect(template.match(/\{\{[A-Z_]+\}\}/g)).toEqual(['{{CSP}}', '{{REFERRER_POLICY}}', '{{PERMISSIONS_POLICY}}']);
  });
});
