import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyBuildDefaults, readBuildInfo } from '@server/lib/buildInfo';

const dirs: string[] = [];
const dirWith = (content?: string) => {
  const d = mkdtempSync(join(tmpdir(), 'wv-build-'));
  dirs.push(d);
  if (content !== undefined) writeFileSync(join(d, 'build.json'), content);
  return d;
};
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

describe('build mode defaults', () => {
  it('runs a production build as production when the host sets nothing', () => {
    const env: Record<string, string | undefined> = {};
    expect(applyBuildDefaults(env, readBuildInfo(dirWith('{"siteEnv":"production","siteUrl":"https://weamazevisionary.com"}')))).toEqual({});
    expect(env).toEqual({ PUBLIC_SITE_ENV: 'production', PUBLIC_SITE_URL: 'https://weamazevisionary.com' });
  });
  it('treats an empty setting as unset', () => {
    const env: Record<string, string | undefined> = { PUBLIC_SITE_ENV: '' };
    applyBuildDefaults(env, { siteEnv: 'production' });
    expect(env.PUBLIC_SITE_ENV).toBe('production');
  });
  it('lets the host setting win, and reports when it differs from the build', () => {
    const env: Record<string, string | undefined> = { PUBLIC_SITE_ENV: 'staging', PUBLIC_SITE_URL: 'https://staging.example.com' };
    expect(applyBuildDefaults(env, { siteEnv: 'production', siteUrl: 'https://weamazevisionary.com' })).toEqual({ mismatch: { built: 'production', running: 'staging' } });
    expect(env).toEqual({ PUBLIC_SITE_ENV: 'staging', PUBLIC_SITE_URL: 'https://staging.example.com' });
  });
  it('changes nothing without a readable build record', () => {
    const env: Record<string, string | undefined> = {};
    expect(readBuildInfo(dirWith())).toBeNull();
    expect(readBuildInfo(dirWith('not json'))).toBeNull();
    expect(applyBuildDefaults(env, null)).toEqual({});
    expect(env).toEqual({});
  });
});
