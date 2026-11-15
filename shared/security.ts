/**
 * One source for the site's security policy, used by the server's response headers,
 * the <meta> tags written into every prerendered page, and the tests.
 *
 * Everything the site loads is its own: fonts, images, films, code and the API.
 * Inline style attributes are used for focal points and aspect ratios, hence
 * 'unsafe-inline' for styles only, never for scripts.
 */

/** Where browsers send Content Security Policy violation reports (handled by the site's own API). */
export const CSP_REPORT_PATH = '/api/csp-report';

const BASE_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
];

/** The full policy, sent as a response header. */
export function headerCsp(opts: { hsts: boolean }): string {
  return [
    ...BASE_DIRECTIVES,
    "frame-ancestors 'none'",
    ...(opts.hsts ? ['upgrade-insecure-requests'] : []),
    `report-uri ${CSP_REPORT_PATH}`,
    'report-to csp',
  ].join('; ');
}

/**
 * The same policy for a <meta http-equiv> tag: a second lock that still holds if the page is
 * ever served without the server's headers (a static host, a cache, a saved copy). Browsers
 * ignore frame-ancestors and reporting in <meta> and warn about them, so they stay header-only.
 */
export function metaCsp(): string {
  return BASE_DIRECTIVES.join('; ');
}

export const REFERRER_POLICY = 'strict-origin-when-cross-origin';

/**
 * Browser features the site never uses are switched off for the page and anything it could
 * ever embed. Only feature names browsers recognise are listed, so none of them logs a warning.
 * Kept on for this site only: autoplay and picture-in-picture (the films), fullscreen (the film
 * player) and clipboard-write (the Copy buttons).
 */
export const PERMISSIONS_POLICY = [
  'accelerometer=()', 'autoplay=(self)', 'browsing-topics=()', 'camera=()', 'captured-surface-control=()',
  'clipboard-read=()', 'clipboard-write=(self)', 'display-capture=()', 'encrypted-media=()', 'fullscreen=(self)',
  'gamepad=()', 'geolocation=()', 'gyroscope=()', 'hid=()', 'identity-credentials-get=()', 'idle-detection=()',
  'interest-cohort=()', 'local-fonts=()', 'local-network-access=()', 'magnetometer=()', 'microphone=()', 'midi=()',
  'otp-credentials=()', 'payment=()', 'picture-in-picture=(self)', 'publickey-credentials-create=()',
  'publickey-credentials-get=()', 'screen-wake-lock=()', 'serial=()', 'storage-access=()', 'sync-xhr=()',
  'usb=()', 'window-management=()', 'xr-spatial-tracking=()',
].join(', ');
