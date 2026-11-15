import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The production build records its site mode and address in dist/server/build.json
 * (scripts/prerender.mjs). Hosts that build and run the site in separate steps, such as
 * Hostinger's managed Node.js apps, may not pass PUBLIC_SITE_ENV to the running server; without
 * it the server would default to "staging" and tell search engines not to index the site.
 * Settings given where the server runs always win; the build only fills in what is missing.
 */
export type BuildInfo = { siteEnv?: string; siteUrl?: string };

export function readBuildInfo(dir: string): BuildInfo | null {
  const file = join(dir, 'build.json');
  if (!existsSync(file)) return null;
  try {
    const info = JSON.parse(readFileSync(file, 'utf8')) as BuildInfo;
    return info && typeof info === 'object' ? info : null;
  } catch {
    return null;
  }
}

/** Fills PUBLIC_SITE_ENV and PUBLIC_SITE_URL from the build when unset; reports a mismatch. */
export function applyBuildDefaults(target: Record<string, string | undefined>, info: BuildInfo | null): { mismatch?: { built: string; running: string } } {
  if (!info) return {};
  const unset = (k: string) => target[k] === undefined || target[k] === '';
  if (unset('PUBLIC_SITE_ENV') && typeof info.siteEnv === 'string') target.PUBLIC_SITE_ENV = info.siteEnv;
  if (unset('PUBLIC_SITE_URL') && typeof info.siteUrl === 'string') target.PUBLIC_SITE_URL = info.siteUrl;
  const built = info.siteEnv;
  const running = target.PUBLIC_SITE_ENV;
  return built && running && built !== running ? { mismatch: { built, running } } : {};
}
