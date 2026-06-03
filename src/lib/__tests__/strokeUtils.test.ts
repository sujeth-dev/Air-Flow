import { describe, it, expect } from 'vitest';
import {
  pathLength,
  centroid,
  resample,
  indicativeAngle,
  rotateBy,
  scaleToSquare,
  translateToOrigin,
} from '../strokeUtils';
import type { Point } from '../strokeUtils';

const square4: Point[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
];

describe('pathLength', () => {
  it('returns 0 for empty or single point', () => {
    expect(pathLength([])).toBe(0);
    expect(pathLength([{ x: 5, y: 5 }])).toBe(0);
  });

  it('returns correct length for axis-aligned path', () => {
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }];
    expect(pathLength(pts)).toBeCloseTo(7);
  });
});

describe('centroid', () => {
  it('returns center of symmetric shape', () => {
    const c = centroid(square4);
    expect(c.x).toBeCloseTo(0.5);
    expect(c.y).toBeCloseTo(0.5);
  });

  it('returns the single point for one-point input', () => {
    const c = centroid([{ x: 3, y: 7 }]);
    expect(c.x).toBe(3);
    expect(c.y).toBe(7);
  });
});

describe('resample', () => {
  it('returns exactly n points', () => {
    const r = resample(square4, 64);
    expect(r).toHaveLength(64);
  });

  it('n=1 case returns independent copies (no shared reference)', () => {
    const r = resample([{ x: 5, y: 10 }], 4);
    expect(r).toHaveLength(4);
    r[0].x = 999;
    expect(r[1].x).toBe(5); // independent copy
  });

  it('returns empty array for empty input', () => {
    expect(resample([], 64)).toHaveLength(0);
  });

  it('first and last points are near the original endpoints', () => {
    const line: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    const r = resample(line, 10);
    expect(r[0].x).toBeCloseTo(0, 1);
    expect(r[9].x).toBeCloseTo(100, 0);
  });
});

describe('indicativeAngle', () => {
  it('returns angle from centroid to first point', () => {
    const pts: Point[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }];
    // centroid = (0,0), first point = (1,0) → angle = 0
    const angle = indicativeAngle(pts);
    expect(angle).toBeCloseTo(0);
  });
});

describe('rotateBy', () => {
  it('rotation by 0 returns same points', () => {
    const r = rotateBy(square4, 0);
    r.forEach((p, i) => {
      expect(p.x).toBeCloseTo(square4[i].x);
      expect(p.y).toBeCloseTo(square4[i].y);
    });
  });

  it('rotation by 2π returns same points', () => {
    const r = rotateBy(square4, 2 * Math.PI);
    r.forEach((p, i) => {
      expect(p.x).toBeCloseTo(square4[i].x);
      expect(p.y).toBeCloseTo(square4[i].y);
    });
  });
});

describe('scaleToSquare', () => {
  it('bounding box is exactly size×size', () => {
    const scaled = scaleToSquare(square4, 100);
    const xs = scaled.map(p => p.x);
    const ys = scaled.map(p => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(100);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(100);
  });

  it('handles degenerate single-axis case (all same x)', () => {
    const line: Point[] = [{ x: 5, y: 0 }, { x: 5, y: 10 }];
    expect(() => scaleToSquare(line, 100)).not.toThrow();
  });
});

describe('translateToOrigin', () => {
  it('centroid of result is (0,0)', () => {
    const translated = translateToOrigin(square4);
    const c = centroid(translated);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(0);
  });
});
