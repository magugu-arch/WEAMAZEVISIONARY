import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import '@shared/enquiry';
import { CSP_REPORT_PATH, PERMISSIONS_POLICY, headerCsp, metaCsp } from '@shared/security';
import { isSelfContainedDownload, securityHeaders, withoutSitePolicy } from '@server/lib/security';
import { cspReports } from '@server/api/router';

describe('security policy', () => {
  it('sends the full policy as a header, with reporting to the site itself', () => {
    const csp = headerCsp({ hsts: true });
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/unsafe-eval|script-src[^;]*unsafe-inline/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain(`report-uri ${CSP_REPORT_PATH}`);
    expect(csp).toContain('report-to csp');
    expect(csp).toContain('upgrade-insecure-requests');
    expect(headerCsp({ hsts: false })).not.toContain('upgrade-insecure-requests');
  });

  it('keeps header-only directives out of the <meta> copy, where browsers ignore them with a warning', () => {
    const meta = metaCsp();
    expect(meta).toContain("default-src 'self'");
    expect(meta).not.toMatch(/frame-ancestors|report-uri|report-to|upgrade-insecure-requests/);
    expect(headerCsp({ hsts: false }).startsWith(meta)).toBe(true);
  });

  it('switches off browser features the site never uses and keeps the ones it does', () => {
    for (const off of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()', 'browsing-topics=()']) expect(PERMISSIONS_POLICY).toContain(off);
    for (const on of ['fullscreen=(self)', 'autoplay=(self)', 'picture-in-picture=(self)', 'clipboard-write=(self)']) expect(PERMISSIONS_POLICY).toContain(on);
  });

  it('sends the hardening headers on every response', () => {
    const h = securityHeaders({ hsts: true, indexable: true });
    expect(h['reporting-endpoints']).toBe(`csp="${CSP_REPORT_PATH}"`);
    expect(h['origin-agent-cluster']).toBe('?1');
    expect(h['x-xss-protection']).toBe('0');
    expect(h['x-permitted-cross-domain-policies']).toBe('none');
    expect(h['strict-transport-security']).toMatch(/max-age=63072000/);
    expect(h['x-robots-tag']).toBeUndefined();
    expect(securityHeaders({ hsts: false, indexable: false })['x-robots-tag']).toBe('noindex, nofollow');
  });

  it('leaves the site policy off the offline edition only, and keeps every other header on it', () => {
    expect(isSelfContainedDownload('/downloads/weamaze-visionary.html')).toBe(true);
    for (const p of ['/', '/work', '/downloads', '/downloads/', '/downloads/a/b.html', '/downloads/file.mp4', '/work/downloads/x.html', '/api/enquiries']) expect(isSelfContainedDownload(p), p).toBe(false);
    const site = securityHeaders({ hsts: true, indexable: true });
    const file = withoutSitePolicy(site);
    expect(file['content-security-policy']).toBeUndefined();
    expect(file['reporting-endpoints']).toBeUndefined();
    const { 'content-security-policy': _csp, 'reporting-endpoints': _rep, ...others } = site;
    expect(file).toEqual(others);
    expect(file['x-frame-options']).toBe('DENY'); // framing stays forbidden without the policy
    expect(site['content-security-policy']).toBeDefined(); // the original is not changed
  });
  it('runs form validation without eval, so the policy has nothing to block', () => {
    expect(z.config().jitless).toBe(true);
  });
});

describe('violation reports', () => {
  it('reads both report formats and keeps only what helps, never query strings or visitor details', () => {
    const legacy = cspReports({ 'csp-report': { 'document-uri': 'https://weamazevisionary.com/contact?email=a@b.c', 'effective-directive': 'script-src-elem', 'blocked-uri': 'inline', disposition: 'enforce' } });
    expect(legacy).toEqual([{ directive: 'script-src-elem', blocked: 'inline', page: '/contact', disposition: 'enforce' }]);
    const modern = cspReports([
      { type: 'csp-violation', body: { documentURL: 'https://weamazevisionary.com/work', effectiveDirective: 'script-src-elem', blockedURL: 'https://evil.example/x.js?token=1' } },
      { type: 'deprecation', body: { id: 'x' } },
    ]);
    expect(modern).toEqual([{ directive: 'script-src-elem', blocked: 'https://evil.example', page: '/work', disposition: undefined }]);
    expect(cspReports([{ type: 'csp-violation', body: { blockedURL: 'data:text/html,<script>' } }])[0]!.blocked).toBe('data:');
  });

  it('ignores junk and caps a flood', () => {
    expect(cspReports(null)).toEqual([]);
    expect(cspReports('x')).toEqual([]);
    expect(cspReports({ 'csp-report': 'x' })).toEqual([]);
    const many = Array.from({ length: 50 }, () => ({ type: 'csp-violation', body: { effectiveDirective: 'img-src\n\u0000forged' } }));
    const out = cspReports(many);
    expect(out).toHaveLength(5);
    expect(out[0]!.directive).not.toMatch(/\p{Cc}/u);
  });
});
