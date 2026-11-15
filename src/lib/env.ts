/**
 * Public (non-secret) build-time configuration. Only variables prefixed with
 * PUBLIC_ reach the browser (vite.config envPrefix). Secrets live server-side.
 */
export type SiteEnv = 'development' | 'staging' | 'production';

const rawEnv = (import.meta.env.PUBLIC_SITE_ENV as string | undefined) ?? (import.meta.env.DEV ? 'development' : 'staging');
export const SITE_ENV: SiteEnv = rawEnv === 'production' ? 'production' : rawEnv === 'development' ? 'development' : 'staging';
export const SITE_URL = ((import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? 'https://weamazevisionary.com').replace(/\/$/, '');
/** Staging and development builds are never indexable. */
export const INDEXABLE = SITE_ENV === 'production';
export const ANALYTICS_PROVIDER = (import.meta.env.PUBLIC_ANALYTICS_PROVIDER as string | undefined) ?? 'none';
export const SHOW_SYSTEM_ROUTES = SITE_ENV !== 'production';
