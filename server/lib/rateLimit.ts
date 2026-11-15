/**
 * Fixed-window rate limiter keyed by client IP + route. In-memory: limits apply
 * per server instance. For multi-instance hosting, back this with a shared
 * store (documented in 07_HANDOVER.md). IPs are hashed and never persisted.
 */
import { createHash } from 'node:crypto';

type Bucket = { count: number; resetAt: number };
export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(private max: number, private windowMs: number) {}
  check(key: string, now = Date.now()): { allowed: boolean; retryAfter: number; remaining: number } {
    const k = createHash('sha256').update(key).digest('base64url').slice(0, 22);
    let b = this.buckets.get(k);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(k, b);
    }
    b.count += 1;
    if (this.buckets.size > 10000) this.sweep(now);
    const allowed = b.count <= this.max;
    return { allowed, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)), remaining: Math.max(0, this.max - b.count) };
  }
  private sweep(now: number) {
    for (const [k, b] of this.buckets) if (b.resetAt <= now) this.buckets.delete(k);
  }
}
