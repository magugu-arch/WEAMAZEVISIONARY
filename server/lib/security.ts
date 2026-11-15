import { CSP_REPORT_PATH, PERMISSIONS_POLICY, REFERRER_POLICY, headerCsp } from '@shared/security';

/**
 * Security headers (V10 §22) sent with every response. The policy itself lives in
 * shared/security.ts so the prerendered pages carry the same rules in <meta> tags.
 */
export function securityHeaders(opts: { hsts: boolean; indexable: boolean }): Record<string, string> {
  return {
    'content-security-policy': headerCsp({ hsts: opts.hsts }),
    'reporting-endpoints': `csp="${CSP_REPORT_PATH}"`,
    'x-content-type-options': 'nosniff',
    'referrer-policy': REFERRER_POLICY,
    'permissions-policy': PERMISSIONS_POLICY,
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'origin-agent-cluster': '?1',
    'x-frame-options': 'DENY',
    // The legacy XSS filter is retired and could itself be abused; the CSP does this job.
    'x-xss-protection': '0',
    'x-permitted-cross-domain-policies': 'none',
    'x-dns-prefetch-control': 'off',
    ...(opts.hsts ? { 'strict-transport-security': 'max-age=63072000; includeSubDomains' } : {}),
    ...(opts.indexable ? {} : { 'x-robots-tag': 'noindex, nofollow' }),
  };
}
