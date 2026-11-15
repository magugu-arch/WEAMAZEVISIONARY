import { z } from 'zod';

/**
 * Zod probes for `new Function` support the first time a schema runs. The site's Content
 * Security Policy forbids eval, so the probe was blocked and reported as a security
 * violation on every form page. Jitless mode skips the probe; validation is unchanged.
 */
z.config({ jitless: true });
