import { describe, it, expect } from 'vitest';
import { recognize, addTemplate } from '../dollarRecognizer';
import type { Point } from '../../engine/stroke';

function circlePoints(n = 64, r = 100): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: r * Math.cos((2 * Math.PI * i) / n),
    y: r * Math.sin((2 * Math.PI * i) / n),
  }));
}

function linePoints(n = 64, len = 200): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: -len / 2 + (len * i) / (n - 1),
    y: 0,
  }));
}

describe('recognize', () => {
  it('returns {name:"unknown", score:0} for empty input', () => {
    const r = recognize([]);
    expect(r.name).toBe('unknown');
    expect(r.score).toBe(0);
  });

  it('returns {name:"unknown", score:0} for fewer than 8 points', () => {
    const r = recognize([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(r.name).toBe('unknown');
    expect(r.score).toBe(0);
  });

  it('recognizes a circle with high score', () => {
    const r = recognize(circlePoints());
    expect(r.name).toBe('circle');
    expect(r.score).toBeGreaterThan(0.8);
  });

  it('recognizes a line with high score', () => {
    const r = recognize(linePoints());
    expect(r.name).toBe('line');
    expect(r.score).toBeGreaterThan(0.75);
  });

  it('circle does not match line (scores below threshold)', () => {
    const r = recognize(circlePoints());
    expect(r.name).not.toBe('line');
  });

  it('score is between 0 and 1', () => {
    const r = recognize(circlePoints());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});

describe('addTemplate', () => {
  it('persists a new template and returns high score for matching input', () => {
    const customPoints: Point[] = Array.from({ length: 32 }, (_, i) => ({
      x: i * 3,
      y: Math.sin(i) * 10,
    }));
    addTemplate('custom-wave', customPoints);
    const r = recognize(customPoints);
    expect(r.name).toBe('custom-wave');
  });
});