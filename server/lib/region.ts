/**
 * Multi-region routing on Fly.io (docs/13_GLOBAL_ARCHITECTURE.md).
 *
 * One machine in the primary region (Johannesburg, "jnb") owns all data: the enquiry
 * store and its email/CRM outbox live on that machine's volume. Machines in other regions
 * ("edge" machines, added only when needed) serve the website from their own copy of the
 * built files, and hand every data request to the primary with Fly's `fly-replay` header
 * before reading its body. Fly's proxy then re-sends the untouched request to Johannesburg,
 * so there is only ever one writer and the data never needs syncing.
 *
 * Fly sets FLY_REGION, FLY_PROCESS_GROUP and PRIMARY_REGION on every machine. Off Fly
 * (local runs, tests, another host) none are set and the server behaves as a single primary.
 */
export type RegionEnv = { PRIMARY_REGION?: string; FLY_REGION?: string; FLY_PROCESS_GROUP?: string };

export type RegionRole =
  | { role: 'primary'; region?: string }
  | { role: 'replica'; region: string; primary: string }
  /** An edge machine placed in the primary region by mistake: it must never write locally. */
  | { role: 'misplaced'; region: string; primary: string };

/** Process group name used for stateless machines outside the primary region (fly.toml). */
export const EDGE_GROUP = 'edge';

/** API paths an edge answers itself: neither reads nor writes stored data. */
const LOCAL_API = new Set(['/api/health', '/api/csp-report']);

const clean = (v?: string) => (v ?? '').trim().toLowerCase() || undefined;

export function regionRole(env: RegionEnv): RegionRole {
  const primary = clean(env.PRIMARY_REGION);
  const region = clean(env.FLY_REGION);
  const edge = clean(env.FLY_PROCESS_GROUP) === EDGE_GROUP;
  if (!primary || !region) {
    // Not enough to route: an edge machine still must not keep data, so refuse rather than guess.
    return edge ? { role: 'misplaced', region: region ?? 'unknown', primary: primary ?? 'unknown' } : { role: 'primary', region };
  }
  if (region === primary) return edge ? { role: 'misplaced', region, primary } : { role: 'primary', region };
  return { role: 'replica', region, primary };
}

/** Whether this API path must be handled by the primary region. */
export const needsPrimary = (pathname: string) => pathname.startsWith('/api/') && !LOCAL_API.has(pathname);

/** Region codes are short lowercase names ("jnb", "lhr"); anything else is never put in a header. */
const REGION = /^[a-z]{3}$/;

/**
 * What a non-primary machine does with an API request: nothing (handle it here), replay it
 * to the primary region, or refuse it. Pure, so it is unit-tested without a server.
 */
export function routeApi(role: RegionRole, pathname: string): { action: 'local' } | { action: 'replay'; header: string } | { action: 'refuse' } {
  if (role.role === 'primary' || !needsPrimary(pathname)) return { action: 'local' };
  if (role.role === 'replica' && REGION.test(role.primary)) return { action: 'replay', header: `region=${role.primary}` };
  return { action: 'refuse' };
}
