import { describe, expect, it } from 'vitest';
import { project, rubberband, VelocityTracker } from '@/lib/spring';

describe('gesture physics', () => {
  it('projects momentum with Apple’s exponential-decay model', () => {
    expect(project(0)).toBe(0);
    // 1000 px/s at the normal deceleration rate travels ≈ 499 px.
    expect(project(1000)).toBeCloseTo(499, 0);
    expect(project(-1000)).toBeCloseTo(-499, 0);
    // A snappier rate travels less.
    expect(Math.abs(project(1000, 0.99))).toBeLessThan(Math.abs(project(1000)));
  });

  it('rubber-bands progressively: never exceeds the drag, never reaches the dimension', () => {
    const dim = 400;
    let prev = 0;
    for (const over of [10, 50, 100, 400, 2000]) {
      const r = rubberband(over, dim);
      expect(r).toBeLessThan(over);
      expect(r).toBeGreaterThan(prev);
      expect(r).toBeLessThan(dim);
      prev = r;
    }
  });

  it('estimates release velocity from the last 100 ms and drops it after a pause', () => {
    const t = new VelocityTracker();
    t.add(0, 0, 1000);
    t.add(50, 0, 1025);
    t.add(100, 0, 1050);
    expect(t.velocity(1050).x).toBeCloseTo(2000, 0);
    // Finger rested 80 ms before lifting: no momentum.
    expect(t.velocity(1130)).toEqual({ x: 0, y: 0 });
    // Old samples fall out of the window.
    t.add(110, 0, 1300);
    t.add(120, 0, 1310);
    expect(t.velocity(1310).x).toBeCloseTo(1000, 0);
  });
});
