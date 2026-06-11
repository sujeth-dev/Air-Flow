import { describe, it, expect } from 'vitest';
import { OneEuroFilter } from '../oneEuroFilter';

describe('OneEuroFilter', () => {
  it('returns the value unchanged on first call', () => {
    const f = new OneEuroFilter();
    expect(f.filter(42, 0)).toBe(42);
  });

  it('returns a value between two inputs (smoothing)', () => {
    const f = new OneEuroFilter(1.0, 0.015, 1.0);
    f.filter(0, 0);
    const smoothed = f.filter(100, 16);
    expect(smoothed).toBeGreaterThan(0);
    expect(smoothed).toBeLessThan(100);
  });

  it('converges toward target over multiple frames', () => {
    const f = new OneEuroFilter(1.0, 0.015, 1.0);
    f.filter(0, 0);
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      prev = f.filter(100, i * 16);
    }
    expect(prev).toBeGreaterThan(50);
  });

  it('reset causes next call to pass through unchanged', () => {
    const f = new OneEuroFilter();
    f.filter(10, 0);
    f.filter(20, 16);
    f.reset();
    const result = f.filter(99, 32);
    expect(result).toBe(99);
  });

  it('handles same timestamp (dt clamped to 1e-6)', () => {
    const f = new OneEuroFilter();
    f.filter(0, 100);
    expect(() => f.filter(1, 100)).not.toThrow();
  });

  it('handles negative velocity (smoothing still works)', () => {
    const f = new OneEuroFilter();
    f.filter(100, 0);
    const result = f.filter(0, 16);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });
});
