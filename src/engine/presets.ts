const ACID = '#c8f24e';
const STROKE_GLOW = '#c8f24e';

function applyStyle(ctx: CanvasRenderingContext2D, lineWidth = 5): void {
  ctx.strokeStyle = ACID;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowBlur = 18;
  ctx.shadowColor = STROKE_GLOW;
}

export type PresetDrawFn = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) => void;

const circle: PresetDrawFn = (ctx, cx, cy, size) => {
  ctx.save();
  applyStyle(ctx);
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.45, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
};

const square: PresetDrawFn = (ctx, cx, cy, size) => {
  ctx.save();
  applyStyle(ctx);
  const h = size * 0.45;
  ctx.beginPath();
  ctx.rect(cx - h, cy - h, h * 2, h * 2);
  ctx.stroke();
  ctx.restore();
};

const triangle: PresetDrawFn = (ctx, cx, cy, size) => {
  ctx.save();
  applyStyle(ctx);
  const r = size * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * Math.sin((2 * Math.PI) / 3), cy + r * Math.cos((2 * Math.PI) / 3) * -1);
  ctx.lineTo(cx + r * Math.sin((4 * Math.PI) / 3), cy + r * Math.cos((4 * Math.PI) / 3) * -1);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

const line: PresetDrawFn = (ctx, cx, cy, size) => {
  ctx.save();
  applyStyle(ctx);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy);
  ctx.lineTo(cx + size * 0.45, cy);
  ctx.stroke();
  ctx.restore();
};

const arrow: PresetDrawFn = (ctx, cx, cy, size) => {
  ctx.save();
  applyStyle(ctx);
  const len = size * 0.9;
  const headLen = size * 0.25;
  const headAngle = Math.PI / 6;
  const x1 = cx - len / 2;
  const x2 = cx + len / 2;

  ctx.beginPath();
  ctx.moveTo(x1, cy);
  ctx.lineTo(x2, cy);
  ctx.lineTo(x2 - headLen * Math.cos(headAngle), cy - headLen * Math.sin(headAngle));
  ctx.moveTo(x2, cy);
  ctx.lineTo(x2 - headLen * Math.cos(headAngle), cy + headLen * Math.sin(headAngle));
  ctx.stroke();
  ctx.restore();
};

const star: PresetDrawFn = (ctx, cx, cy, size) => {
  ctx.save();
  applyStyle(ctx);
  const outerR = size * 0.45;
  const innerR = outerR * 0.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

export const PRESETS: Record<string, PresetDrawFn> = {
  circle,
  square,
  triangle,
  line,
  arrow,
  star,
};
