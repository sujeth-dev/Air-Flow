import type { Point } from '../engine/stroke';

function circlePoints(n = 64, r = 100): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
  });
}

function squarePoints(n = 64, side = 200): Point[] {
  const h = side / 2;
  const perSide = Math.floor(n / 4);
  const pts: Point[] = [];
  for (let i = 0; i < perSide; i++) {
    pts.push({ x: -h + (side * i) / perSide, y: -h });
  }
  for (let i = 0; i < perSide; i++) {
    pts.push({ x: h, y: -h + (side * i) / perSide });
  }
  for (let i = 0; i < perSide; i++) {
    pts.push({ x: h - (side * i) / perSide, y: h });
  }
  for (let i = 0; i < perSide; i++) {
    pts.push({ x: -h, y: h - (side * i) / perSide });
  }
  return pts;
}

function trianglePoints(n = 64, r = 100): Point[] {
  const vertices: Point[] = [
    { x: 0, y: -r },
    { x: r * Math.sin((2 * Math.PI) / 3), y: r * Math.cos((2 * Math.PI) / 3) * -1 },
    { x: r * Math.sin((4 * Math.PI) / 3), y: r * Math.cos((4 * Math.PI) / 3) * -1 },
  ];
  const perEdge = Math.floor(n / 3);
  const pts: Point[] = [];
  for (let e = 0; e < 3; e++) {
    const from = vertices[e];
    const to = vertices[(e + 1) % 3];
    for (let i = 0; i < perEdge; i++) {
      const t = i / perEdge;
      pts.push({ x: from.x + t * (to.x - from.x), y: from.y + t * (to.y - from.y) });
    }
  }
  while (pts.length < n) pts.push({ ...vertices[0] });
  return pts;
}

function linePoints(n = 64, len = 200): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: -len / 2 + (len * i) / (n - 1),
    y: 0,
  }));
}

function arrowPoints(n = 64, len = 200): Point[] {
  const shaft = Math.floor(n * 0.6);
  const wing = Math.floor(n * 0.2);
  const pts: Point[] = [];
  const tip = { x: len / 2, y: 0 };
  const base = { x: -len / 2, y: 0 };
  const headLen = 50;
  const headAngle = Math.PI / 6;

  for (let i = 0; i < shaft; i++) {
    const t = i / (shaft - 1);
    pts.push({ x: base.x + t * (tip.x - base.x), y: 0 });
  }
  for (let i = 0; i < wing; i++) {
    const t = wing > 1 ? i / (wing - 1) : 0;
    pts.push({
      x: tip.x - headLen * Math.cos(headAngle) * t,
      y: -headLen * Math.sin(headAngle) * t,
    });
  }
  for (let i = wing - 1; i >= 0; i--) {
    const t = wing > 1 ? i / (wing - 1) : 0;
    pts.push({
      x: tip.x - headLen * Math.cos(headAngle) * t,
      y: headLen * Math.sin(headAngle) * t,
    });
  }
  while (pts.length < n) pts.push({ ...tip });
  return pts;
}

function starPoints(n = 64, outerR = 100, innerR = 40): Point[] {
  const points5: Point[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points5.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  points5.push({ ...points5[0] });

  const total = points5.length - 1;
  const perSeg = Math.floor(n / total);
  const pts: Point[] = [];
  for (let i = 0; i < total; i++) {
    const from = points5[i];
    const to = points5[i + 1];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg;
      pts.push({ x: from.x + t * (to.x - from.x), y: from.y + t * (to.y - from.y) });
    }
  }
  while (pts.length < n) pts.push({ ...points5[0] });
  return pts;
}

export const TEMPLATES: Array<{ name: string; points: Point[] }> = [
  { name: 'circle', points: circlePoints() },
  { name: 'square', points: squarePoints() },
  { name: 'triangle', points: trianglePoints() },
  { name: 'line', points: linePoints() },
  { name: 'arrow', points: arrowPoints() },
  { name: 'star', points: starPoints() },
];
