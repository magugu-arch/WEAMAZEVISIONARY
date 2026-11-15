import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-SHA256 signatures over `${timestamp}.${body}` with a replay window.
 * Used to sign outgoing CRM webhooks and to verify incoming provider webhooks.
 */
export function sign(secret: string, timestamp: number, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export type VerifyResult = { ok: true } | { ok: false; reason: 'missing' | 'stale' | 'mismatch' | 'replayed' };

export class ReplayGuard {
  private seen = new Map<string, number>();
  constructor(private ttlMs = 10 * 60 * 1000) {}
  /** Returns false if this event ID was already processed within the TTL. */
  claim(id: string, now = Date.now()): boolean {
    for (const [k, t] of this.seen) if (t < now - this.ttlMs) this.seen.delete(k);
    if (this.seen.has(id)) return false;
    this.seen.set(id, now);
    return true;
  }
}

export function verifySignature(opts: { secret: string; body: string; timestamp: string | null; signature: string | null; toleranceSec?: number; now?: number }): VerifyResult {
  const { secret, body, timestamp, signature, toleranceSec = 300, now = Date.now() } = opts;
  if (!timestamp || !signature) return { ok: false, reason: 'missing' };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > toleranceSec) return { ok: false, reason: 'stale' };
  const expected = Buffer.from(sign(secret, ts, body), 'hex');
  const given = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'mismatch' };
  return { ok: true };
}
