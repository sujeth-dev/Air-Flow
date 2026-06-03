export type Point = { x: number; y: number };

export function pathLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

export function centroid(pts: Point[]): Point {
  let sx = 0, sy = 0;
  for (const p of pts) { sx += p.x; sy += p.y; }
  return { x: sx / pts.length, y: sy / pts.length };
}

export function resample(pts: Point[], n = 64): Point[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) {
    const p = pts[0];
    return Array.from({ length: n }, () => ({ x: p.x, y: p.y }));
  }

  const total = pathLength(pts);
  const interval = total / (n - 1);
  let accum = 0;
  const result: Point[] = [{ ...pts[0] }];
  let prev = pts[0];

  for (let i = 1; i < pts.length && result.length < n; i++) {
    const cur = pts[i];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);

    if (accum + segLen >= interval) {
      let remaining = interval - accum;
      while (remaining <= segLen && result.length < n) {
        const t = remaining / segLen;
        result.push({ x: prev.x + t * dx, y: prev.y + t * dy });
        remaining += interval;
      }
      accum = segLen - (remaining - interval);
    } else {
      accum += segLen;
    }
    prev = cur;
  }

  while (result.length < n) result.push({ ...pts[pts.length - 1] });
  return result;
}

export function indicativeAngle(pts: Point[]): number {
  const c = centroid(pts);
  return Math.atan2(pts[0].y - c.y, pts[0].x - c.x);
}

export function rotateBy(pts: Point[], angle: number): Point[] {
  const c = centroid(pts);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return pts.map(p => {
    const qx = p.x - c.x;
    const qy = p.y - c.y;
    return { x: qx * cos - qy * sin + c.x, y: qx * sin + qy * cos + c.y };
  });
}

export function scaleToSquare(pts: Point[], size = 250): Point[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  return pts.map(p => ({
    x: (p.x - minX) * (size / w),
    y: (p.y - minY) * (size / h),
  }));
}

export function translateToOrigin(pts: Point[]): Point[] {
  const c = centroid(pts);
  return pts.map(p => ({ x: p.x - c.x, y: p.y - c.y }));
}
