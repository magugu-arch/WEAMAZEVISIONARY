import { describe, expect, it } from 'vitest';
import { ReplayGuard, sign, verifySignature } from '@server/lib/signature';
import { RateLimiter } from '@server/lib/rateLimit';
import { newReference } from '@server/lib/leadStore';

describe('webhook signatures', () => {
  const secret = 'top-secret-value-123';
  const body = '{"id":"evt_9"}';
  const now = 1_800_000_000_000;
  const ts = Math.floor(now / 1000);
  it('accepts a valid signature inside the tolerance window', () => {
    expect(verifySignature({ secret, body, timestamp: String(ts), signature: `sha256=${sign(secret, ts, body)}`, now })).toEqual({ ok: true });
  });
  it('rejects missing, stale and mismatched signatures', () => {
    expect(verifySignature({ secret, body, timestamp: null, signature: null, now }).ok).toBe(false);
    expect(verifySignature({ secret, body, timestamp: String(ts - 1000), signature: sign(secret, ts - 1000, body), now })).toEqual({ ok: false, reason: 'stale' });
    expect(verifySignature({ secret, body: body + ' ', timestamp: String(ts), signature: sign(secret, ts, body), now })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifySignature({ secret, body, timestamp: String(ts), signature: 'zz', now })).toEqual({ ok: false, reason: 'mismatch' });
  });
  it('detects replayed event IDs', () => {
    const g = new ReplayGuard();
    expect(g.claim('a', now)).toBe(true);
    expect(g.claim('a', now + 1000)).toBe(false);
    expect(g.claim('a', now + 11 * 60_000)).toBe(true);
  });
});

describe('rate limiter', () => {
  it('allows up to max per window then reports retry-after', () => {
    const rl = new RateLimiter(2, 60_000);
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 1).allowed).toBe(true);
    const third = rl.check('ip', 2);
    expect(third.allowed).toBe(false);
    expect(third.retryAfter).toBe(60);
    expect(rl.check('ip', 60_001).allowed).toBe(true);
  });
});

describe('lead references', () => {
  it('are prefixed by type, dated and non-sequential', () => {
    const a = newReference('project', new Date('2026-11-04T00:00:00Z'));
    const b = newReference('project', new Date('2026-11-04T00:00:00Z'));
    expect(a).toMatch(/^WV-ENQ-2026-[2-9A-HJ-NP-Z]{6}$/);
    expect(a).not.toBe(b);
    expect(newReference('partnership')).toMatch(/^WV-PTR-/);
    expect(newReference('call-request')).toMatch(/^WV-CALL-/);
  });
});
