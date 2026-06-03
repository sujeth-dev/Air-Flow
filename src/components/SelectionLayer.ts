export interface CompletedShape {
  id: string;
  shape: string;
  cx: number;
  cy: number;
  size: number;
}

const HANDLE_RADIUS = 14;

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  shape: CompletedShape,
): void {
  const half = shape.size * 0.6;
  ctx.save();
  ctx.strokeStyle = '#5fd4d6';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#5fd4d6';
  ctx.strokeRect(shape.cx - half, shape.cy - half, half * 2, half * 2);
  ctx.setLineDash([]);

  // Delete handle (top-right)
  const dhx = shape.cx + half;
  const dhy = shape.cy - half;
  ctx.beginPath();
  ctx.arc(dhx, dhy, HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#e05555';
  ctx.shadowColor = '#e05555';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('×', dhx, dhy);

  // Resize handle (bottom-right)
  const rhx = shape.cx + half;
  const rhy = shape.cy + half;
  ctx.beginPath();
  ctx.arc(rhx, rhy, HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#5fd4d6';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#5fd4d6';
  ctx.fill();
  ctx.fillStyle = '#0c0d10';
  ctx.shadowBlur = 0;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('◎', rhx, rhy);

  ctx.restore();
}

export type HitRegion = 'body' | 'delete-handle' | 'resize-handle';

export function hitTestShape(
  point: { x: number; y: number },
  shape: CompletedShape,
): HitRegion | null {
  const half = shape.size * 0.6;
  const dhx = shape.cx + half;
  const dhy = shape.cy - half;
  if (dist(point, { x: dhx, y: dhy }) <= HANDLE_RADIUS + 4) return 'delete-handle';

  const rhx = shape.cx + half;
  const rhy = shape.cy + half;
  if (dist(point, { x: rhx, y: rhy }) <= HANDLE_RADIUS + 4) return 'resize-handle';

  if (
    point.x >= shape.cx - half && point.x <= shape.cx + half &&
    point.y >= shape.cy - half && point.y <= shape.cy + half
  ) return 'body';

  return null;
}

export function hitTestAllShapes(
  point: { x: number; y: number },
  shapes: CompletedShape[],
): { shapeId: string; hit: HitRegion } | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const hit = hitTestShape(point, shapes[i]);
    if (hit) return { shapeId: shapes[i].id, hit };
  }
  return null;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
