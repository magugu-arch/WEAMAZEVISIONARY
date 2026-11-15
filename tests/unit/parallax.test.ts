import { describe, expect, it } from 'vitest';
import { frameProgress, layerOffset } from '@/lib/parallax';

describe('parallax fallback maths', () => {
  it('cover progress runs from entering at the bottom to leaving at the top, clamped', () => {
    expect(frameProgress(900, 400, 900, 'cover')).toBe(0); // top edge at viewport bottom
    expect(frameProgress(-400, 400, 900, 'cover')).toBe(1); // bottom edge at viewport top
    expect(frameProgress(250, 400, 900, 'cover')).toBeCloseTo(0.5);
    expect(frameProgress(2000, 400, 900, 'cover')).toBe(0);
    expect(frameProgress(-2000, 400, 900, 'cover')).toBe(1);
  });
  it('exit progress starts with the frame at the top of the viewport', () => {
    expect(frameProgress(0, 900, 900, 'exit')).toBe(0);
    expect(frameProgress(-450, 900, 900, 'exit')).toBeCloseTo(0.5);
    expect(frameProgress(-900, 900, 900, 'exit')).toBe(1);
  });
  it('depth layers travel −a → +a; the hero travels 0 → shift; never beyond', () => {
    expect(layerOffset('media', 0, 44, 0)).toBe(-44);
    expect(layerOffset('media', 0.5, 44, 0)).toBe(0);
    expect(layerOffset('motif', 1, 44, 0)).toBe(44);
    expect(layerOffset('hero', 0, 44, 216)).toBe(0);
    expect(layerOffset('hero', 1, 44, 216)).toBe(216);
  });
});
