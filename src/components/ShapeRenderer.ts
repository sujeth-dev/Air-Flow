import type { Point } from '../lib/strokeUtils';
import type { FSMState } from '../lib/gestureFSM';
import { PRESETS } from '../data/presets';
import { drawSelection } from './SelectionLayer';

const ACID = '#c8f24e';
const MUTED = '#8b9199';
const CYAN = '#5fd4d6';
const BG = '#0c0d10';

export interface CompletedShape {
  id: string;
  shape: string;
  cx: number;
  cy: number;
  size: number;
}

export interface MorphAnimation {
  id: string;
  shape: string;
  sourceStroke: Point[];
  progress: number;
  cx: number;
  cy: number;
  size: number;
}

export interface RenderState {
  strokeInProgress: Point[];
  morphAnimations: MorphAnimation[];
  completedShapes: CompletedShape[];
  fsmState: FSMState;
  currentPoint: Point | null;
  canvasWidth: number;
  canvasHeight: number;
  reducedMotion: boolean;
  selectedShapeId: string | null;
}

function strokeToCanvas(pts: Point[], w: number, h: number): Point[] {
  return pts.map(p => ({ x: p.x * w, y: p.y * h }));
}

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: RenderState
): void {
  const { canvasWidth: w, canvasHeight: h } = state;

  ctx.clearRect(0, 0, w, h);

  for (const shape of state.completedShapes) {
    PRESETS[shape.shape]?.(ctx, shape.cx, shape.cy, shape.size);
  }

  for (const anim of state.morphAnimations) {
    const t = easeInOut(Math.min(1, anim.progress));
    const rawPts = strokeToCanvas(anim.sourceStroke, w, h);
    const strokeCx = rawPts.reduce((s, p) => s + p.x, 0) / rawPts.length;
    const strokeCy = rawPts.reduce((s, p) => s + p.y, 0) / rawPts.length;

    ctx.save();
    ctx.globalAlpha = t < 0.5 ? 1 : 2 - 2 * t;
    if (rawPts.length > 1) {
      ctx.strokeStyle = ACID;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = ACID;
      ctx.beginPath();
      ctx.moveTo(rawPts[0].x, rawPts[0].y);
      for (let i = 1; i < rawPts.length; i++) {
        const lx = rawPts[i].x + (anim.cx - strokeCx) * t;
        const ly = rawPts[i].y + (anim.cy - strokeCy) * t;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }
    ctx.restore();

    if (t > 0.3) {
      ctx.save();
      ctx.globalAlpha = (t - 0.3) / 0.7;
      PRESETS[anim.shape]?.(ctx, anim.cx, anim.cy, anim.size);
      ctx.restore();
    }
  }

  const pts = strokeToCanvas(state.strokeInProgress, w, h);
  if (pts.length > 1) {
    for (let i = 1; i < pts.length; i++) {
      const age = i / pts.length;
      ctx.save();
      ctx.globalAlpha = age * 0.85;
      ctx.strokeStyle = ACID;
      ctx.lineWidth = 3 + age * 2;
      ctx.lineCap = 'round';
      ctx.shadowBlur = age * 14;
      ctx.shadowColor = ACID;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (state.currentPoint && state.fsmState !== 'INACTIVE') {
    const cx = state.currentPoint.x * w;
    const cy = state.currentPoint.y * h;
    const now = Date.now();

    ctx.save();

    if (state.fsmState === 'DRAWING') {
      ctx.shadowBlur = 20;
      ctx.shadowColor = ACID;
      ctx.fillStyle = ACID;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = BG;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fill();
    } else if (state.fsmState === 'RECOGNIZING') {
      const pulse = 0.5 + 0.5 * Math.sin(now / 120);
      ctx.shadowBlur = 10 + pulse * 20;
      ctx.shadowColor = CYAN;
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + pulse * 4, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // ACTIVE state — muted dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = MUTED;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Selection highlight
  if (state.selectedShapeId) {
    const sel = state.completedShapes.find((s) => s.id === state.selectedShapeId);
    if (sel) drawSelection(ctx, sel);
  }
}

export function computeShapePlacement(
  stroke: Point[],
  canvasWidth: number,
  canvasHeight: number
): { cx: number; cy: number; size: number } {
  if (stroke.length === 0) {
    return { cx: canvasWidth / 2, cy: canvasHeight / 2, size: 180 };
  }

  const pts = strokeToCanvas(stroke, canvasWidth, canvasHeight);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const size = Math.max(maxX - minX, maxY - minY, 80);
  return { cx, cy, size };
}

export function drawMiniglyph(
  ctx: CanvasRenderingContext2D,
  shape: string,
  cx: number,
  cy: number,
  size: number
): void {
  ctx.save();
  ctx.strokeStyle = ACID;
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 6;
  ctx.shadowColor = ACID;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const r = size / 2;
  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    case 'square':
      ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * Math.sin((2 * Math.PI) / 3), cy + r * 0.5);
      ctx.lineTo(cx - r * Math.sin((2 * Math.PI) / 3), cy + r * 0.5);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
      break;
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx + r * 0.6, cy - r * 0.4);
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx + r * 0.6, cy + r * 0.4);
      ctx.stroke();
      break;
    case 'star': {
      const outerR = r;
      const innerR = r * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * i) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? outerR : innerR;
        const x = cx + rad * Math.cos(angle);
        const y = cy + rad * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
  }
  ctx.restore();
}

export { lerp };
