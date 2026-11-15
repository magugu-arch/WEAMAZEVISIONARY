/**
 * Interruptible, velocity-aware springs for gesture-driven motion.
 * Parameters follow Apple's designer-facing model: damping ratio (1 = no
 * overshoot) and response (seconds). CI §25: critically damped, response 0.35 s.
 */
export type SpringParams = { damping?: number; response?: number };
const DEFAULT: Required<SpringParams> = { damping: 1, response: 0.35 };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** One animated scalar. Retargeting keeps the current position and velocity, so there is never a jump or a velocity "brick wall". */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  private raf = 0;
  private last = 0;
  private params = DEFAULT;
  private onRest: (() => void) | undefined;

  constructor(initial: number, private onUpdate: (v: number) => void) {
    this.value = initial;
    this.target = initial;
  }

  /** Jump without animation (e.g. while a finger is tracking 1:1). */
  set(value: number) {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.onUpdate(value);
  }

  /** Animate to `target`, inheriting `velocity` (px/s) from a released gesture. */
  to(target: number, opts: SpringParams & { velocity?: number; onRest?: () => void } = {}) {
    this.target = target;
    if (opts.velocity !== undefined) this.velocity = opts.velocity;
    this.params = { damping: opts.damping ?? DEFAULT.damping, response: opts.response ?? DEFAULT.response };
    this.onRest = opts.onRest;
    if (prefersReducedMotion()) {
      this.set(target);
      this.onRest?.();
      return;
    }
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  get animating() {
    return this.raf !== 0;
  }

  private tick = (now: number) => {
    const dt = Math.min(0.064, (now - this.last) / 1000);
    this.last = now;
    const omega = (2 * Math.PI) / this.params.response;
    const k = omega * omega;
    const c = 2 * this.params.damping * omega;
    // Fixed sub-steps keep the integration stable on slow frames.
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const force = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
    }
    if (Math.abs(this.value - this.target) < 0.3 && Math.abs(this.velocity) < 4) {
      this.value = this.target;
      this.velocity = 0;
      this.raf = 0;
      this.onUpdate(this.value);
      const done = this.onRest;
      this.onRest = undefined;
      done?.();
      return;
    }
    this.onUpdate(this.value);
    this.raf = requestAnimationFrame(this.tick);
  };
}

/** Apple's momentum projection: where a flick would come to rest (WWDC 2018 sample code). */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a boundary instead of a hard stop. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Tracks recent pointer samples to estimate release velocity (px/s). */
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = [];
  add(x: number, y: number, t = performance.now()) {
    this.samples.push({ t, x, y });
    while (this.samples.length > 2 && t - this.samples[0]!.t > 100) this.samples.shift();
  }
  /** Release velocity. A finger that paused before lifting has no momentum. */
  velocity(now = performance.now()): { x: number; y: number } {
    const s = this.samples;
    if (s.length < 2) return { x: 0, y: 0 };
    const a = s[0]!, b = s[s.length - 1]!;
    if (now - b.t > 60) return { x: 0, y: 0 };
    const dt = Math.max(1, b.t - a.t) / 1000;
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  }
  reset() {
    this.samples = [];
  }
}
