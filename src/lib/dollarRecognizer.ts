import type { Point } from './strokeUtils';
import {
  resample,
  indicativeAngle,
  rotateBy,
  scaleToSquare,
  translateToOrigin,
} from './strokeUtils';
import { TEMPLATES } from '../data/templates';

const SIZE = 250;
const NUM_POINTS = 64;
const ANGLE_RANGE = Math.PI / 4;
const ANGLE_PRECISION = Math.PI / 90;
const PHI = 0.5 * (-1 + Math.sqrt(5));

export type Template = { name: string; points: Point[] };

function preprocess(pts: Point[]): Point[] {
  let p = resample(pts, NUM_POINTS);
  const angle = indicativeAngle(p);
  p = rotateBy(p, -angle);
  p = scaleToSquare(p, SIZE);
  p = translateToOrigin(p);
  return p;
}

function avgDistance(a: Point[], b: Point[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const dx = a[i].x - b[i].x;
    const dy = a[i].y - b[i].y;
    d += Math.sqrt(dx * dx + dy * dy);
  }
  return d / a.length;
}

function distAtAngle(pts: Point[], tmpl: Point[], angle: number): number {
  const rotated = rotateBy(pts, angle);
  return avgDistance(rotated, tmpl);
}

function goldenSectionSearch(
  pts: Point[],
  tmpl: Point[],
  a: number,
  b: number,
  threshold: number
): number {
  let x1 = PHI * a + (1 - PHI) * b;
  let x2 = (1 - PHI) * a + PHI * b;
  let f1 = distAtAngle(pts, tmpl, x1);
  let f2 = distAtAngle(pts, tmpl, x2);

  while (Math.abs(b - a) > threshold) {
    if (f1 < f2) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = PHI * a + (1 - PHI) * b;
      f1 = distAtAngle(pts, tmpl, x1);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = (1 - PHI) * a + PHI * b;
      f2 = distAtAngle(pts, tmpl, x2);
    }
  }
  return Math.min(f1, f2);
}

const templates: Template[] = TEMPLATES.map(t => ({
  name: t.name,
  points: preprocess(t.points),
}));

export function addTemplate(name: string, rawPoints: Point[]): void {
  templates.push({ name, points: preprocess(rawPoints) });
}

export function recognize(rawPoints: Point[]): { name: string; score: number } {
  if (rawPoints.length < 8) return { name: 'unknown', score: 0 };
  const pts = preprocess(rawPoints);
  const half = 0.5 * Math.sqrt(2 * SIZE * SIZE);

  let bestDist = Infinity;
  let bestName = 'unknown';

  for (const tmpl of templates) {
    const d = goldenSectionSearch(pts, tmpl.points, -ANGLE_RANGE, ANGLE_RANGE, ANGLE_PRECISION);
    if (d < bestDist) {
      bestDist = d;
      bestName = tmpl.name;
    }
  }

  const score = 1 - bestDist / half;
  return { name: bestName, score: Math.max(0, score) };
}
