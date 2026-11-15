import { describe, expect, it } from 'vitest';
import { needsPrimary, regionRole, routeApi } from '@server/lib/region';
import { parseServerEnv } from '@server/lib/env';

describe('region role', () => {
  it('is a single primary off Fly (no region variables)', () => {
    expect(regionRole({})).toEqual({ role: 'primary', region: undefined });
  });
  it('is primary for the app machine in Johannesburg', () => {
    expect(regionRole({ PRIMARY_REGION: 'jnb', FLY_REGION: 'jnb', FLY_PROCESS_GROUP: 'app' }).role).toBe('primary');
  });
  it('is a replica for an edge machine in another region', () => {
    expect(regionRole({ PRIMARY_REGION: 'jnb', FLY_REGION: 'lhr', FLY_PROCESS_GROUP: 'edge' })).toEqual({ role: 'replica', region: 'lhr', primary: 'jnb' });
  });
  it('is a replica for any machine outside the primary region, whatever its group', () => {
    expect(regionRole({ PRIMARY_REGION: 'JNB', FLY_REGION: 'iad', FLY_PROCESS_GROUP: 'app' }).role).toBe('replica');
  });
  it('flags an edge machine placed in the primary region, or without region details', () => {
    expect(regionRole({ PRIMARY_REGION: 'jnb', FLY_REGION: 'jnb', FLY_PROCESS_GROUP: 'edge' }).role).toBe('misplaced');
    expect(regionRole({ FLY_PROCESS_GROUP: 'edge' }).role).toBe('misplaced');
  });
});

describe('API routing outside the primary region', () => {
  const replica = regionRole({ PRIMARY_REGION: 'jnb', FLY_REGION: 'sin', FLY_PROCESS_GROUP: 'edge' });
  it('keeps health checks and CSP reports local, sends all data requests to the primary', () => {
    expect(needsPrimary('/api/health')).toBe(false);
    expect(needsPrimary('/api/csp-report')).toBe(false);
    for (const p of ['/api/enquiries', '/api/booking/config', '/api/booking/bookings', '/api/webhooks/booking', '/api/unknown']) expect(needsPrimary(p)).toBe(true);
    expect(routeApi(replica, '/api/enquiries')).toEqual({ action: 'replay', header: 'region=jnb' });
    expect(routeApi(replica, '/api/health')).toEqual({ action: 'local' });
  });
  it('handles everything locally on the primary', () => {
    expect(routeApi(regionRole({ PRIMARY_REGION: 'jnb', FLY_REGION: 'jnb' }), '/api/enquiries')).toEqual({ action: 'local' });
    expect(routeApi(regionRole({}), '/api/enquiries')).toEqual({ action: 'local' });
  });
  it('refuses data requests on a misplaced edge, and never puts an odd region name in a header', () => {
    expect(routeApi(regionRole({ PRIMARY_REGION: 'jnb', FLY_REGION: 'jnb', FLY_PROCESS_GROUP: 'edge' }), '/api/enquiries')).toEqual({ action: 'refuse' });
    expect(routeApi(regionRole({ PRIMARY_REGION: 'jnb;x=1', FLY_REGION: 'lhr' }), '/api/enquiries')).toEqual({ action: 'refuse' });
  });
  it('accepts the Fly variables in the server environment', () => {
    const env = parseServerEnv({ PRIMARY_REGION: 'jnb', FLY_REGION: 'lhr', FLY_PROCESS_GROUP: 'edge' });
    expect(regionRole(env).role).toBe('replica');
  });
});
