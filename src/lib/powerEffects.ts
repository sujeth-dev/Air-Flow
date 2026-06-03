import { ParticleSystem } from './particleSystem';

// ─── FIREBALL — circle recognized ────────────────────────────────────────────
export function triggerFireball(
  system: ParticleSystem,
  cx: number,
  cy: number,
): void {
  system.emit({
    x: cx, y: cy, count: 80,
    speed: [0.08, 0.35], radius: [4, 14],
    colors: ['#ff2200', '#ff6600', '#ff9900', '#ffcc00', '#ffffff'],
    decay: [0.6, 1.2], glow: 30, shape: 'circle',
  });
  system.emit({
    x: cx, y: cy, count: 30,
    speed: [0.15, 0.5], radius: [2, 6],
    colors: ['#ffcc00', '#ffffff'],
    decay: [0.8, 1.5], glow: 20, shape: 'spark',
  });
}

export function emitEmbers(system: ParticleSystem, cx: number, cy: number): void {
  system.emit({
    x: cx + (Math.random() - 0.5) * 60,
    y: cy + (Math.random() - 0.5) * 60,
    count: 3,
    speed: [0.01, 0.06], radius: [2, 5],
    colors: ['#ff6600', '#ff9900', '#ffcc00'],
    decay: [1.0, 2.5], glow: 15, shape: 'circle',
  });
}

// ─── LIGHTNING SLASH — line recognized ───────────────────────────────────────
export function drawLightningBolt(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  alpha: number,
): void {
  const segments = 10;
  const pts = lightningPath(x1, y1, x2, y2, segments);

  const passes = [
    { color: 'rgba(255,255,255,' + alpha + ')', width: 3 },
    { color: 'rgba(95,212,214,' + (alpha * 0.7) + ')', width: 7 },
    { color: 'rgba(50,120,255,' + (alpha * 0.35) + ')', width: 12 },
  ];

  for (const pass of passes) {
    ctx.beginPath();
    ctx.strokeStyle = pass.color;
    ctx.lineWidth = pass.width;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#5fd4d6';
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  // Branches
  for (let b = 0; b < 5; b++) {
    const idx = 1 + Math.floor(Math.random() * (pts.length - 2));
    const bLen = 30 + Math.random() * 60;
    const bAng = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.8;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(95,212,214,' + (alpha * 0.5) + ')';
    ctx.lineWidth = 1.5;
    ctx.moveTo(pts[idx].x, pts[idx].y);
    ctx.lineTo(pts[idx].x + Math.cos(bAng) * bLen, pts[idx].y + Math.sin(bAng) * bLen);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

function lightningPath(
  x1: number, y1: number,
  x2: number, y2: number,
  segs: number,
): Array<{ x: number; y: number }> {
  const pts = [{ x: x1, y: y1 }];
  const dx = (x2 - x1) / segs;
  const dy = (y2 - y1) / segs;
  const perp = { x: -dy, y: dx };
  const perpLen = Math.sqrt(perp.x * perp.x + perp.y * perp.y) || 1;
  for (let i = 1; i < segs; i++) {
    const jag = (Math.random() - 0.5) * 40;
    pts.push({
      x: x1 + dx * i + (perp.x / perpLen) * jag,
      y: y1 + dy * i + (perp.y / perpLen) * jag,
    });
  }
  pts.push({ x: x2, y: y2 });
  return pts;
}

export function triggerLightningSlash(
  system: ParticleSystem,
  cx: number,
  cy: number,
  size: number,
): void {
  const half = size * 0.6;
  system.emit({
    x: cx, y: cy, count: 40,
    speed: [0.05, 0.2], radius: [2, 6],
    colors: ['#ffffff', '#5fd4d6', '#88eeff'],
    decay: [1.0, 2.5], glow: 20, shape: 'spark',
    angle: [0, Math.PI * 2],
  });
  // Expose endpoints on the system for the renderer to pick up
  (system as ParticleSystem & { _lightningX1?: number })._lightningX1 = cx - half;
  (system as ParticleSystem & { _lightningY1?: number })._lightningY1 = cy;
  (system as ParticleSystem & { _lightningX2?: number })._lightningX2 = cx + half;
  (system as ParticleSystem & { _lightningY2?: number })._lightningY2 = cy;
}

// ─── IRON FIST PUNCH — fist gesture ──────────────────────────────────────────
export interface IronFistEffect {
  cx: number; cy: number;
  startTime: number;
  duration: number; // ms
}

export function triggerIronFist(
  system: ParticleSystem,
  cx: number,
  cy: number,
): IronFistEffect {
  system.emit({
    x: cx, y: cy, count: 60,
    speed: [0.1, 0.45], radius: [5, 14],
    colors: ['#c8f24e', '#ffff00', '#ffffff', '#f2a93b'],
    decay: [0.5, 1.0], glow: 30, shape: 'circle',
  });
  return { cx, cy, startTime: performance.now(), duration: 600 };
}

export function renderIronFistShockwave(
  ctx: CanvasRenderingContext2D,
  effect: IronFistEffect,
  now: number,
): boolean {
  const t = (now - effect.startTime) / effect.duration;
  if (t >= 1) return false;

  const maxR = 200;

  // Primary ring
  const r1 = t * maxR;
  const alpha1 = Math.max(0, 1 - t * 1.5);
  ctx.save();
  ctx.beginPath();
  ctx.arc(effect.cx, effect.cy, r1, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(200,242,78,${alpha1})`;
  ctx.lineWidth = 8 * (1 - t) + 1;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#c8f24e';
  ctx.stroke();

  // Secondary ring with delay
  if (t > 0.1) {
    const t2 = (t - 0.1) / 0.9;
    const r2 = t2 * maxR * 0.8;
    const alpha2 = Math.max(0, 1 - t2 * 1.5);
    ctx.beginPath();
    ctx.arc(effect.cx, effect.cy, r2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(95,212,214,${alpha2})`;
    ctx.lineWidth = 5 * (1 - t2) + 1;
    ctx.shadowColor = '#5fd4d6';
    ctx.stroke();
  }

  // "IMPACT" text
  if (t < 0.5) {
    const scale = t < 0.15 ? t / 0.15 * 1.3 : t < 0.25 ? 1.3 - (t - 0.15) / 0.1 * 0.3 : 1.0;
    ctx.globalAlpha = Math.max(0, 1 - t * 2);
    ctx.save();
    ctx.translate(effect.cx, effect.cy - 60);
    ctx.scale(scale, scale);
    ctx.font = "bold 42px 'Bricolage Grotesque', sans-serif";
    ctx.fillStyle = '#c8f24e';
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#c8f24e';
    ctx.textAlign = 'center';
    ctx.fillText('IMPACT', 0, 0);
    ctx.restore();
  }

  ctx.restore();
  return true;
}

// ─── POWER STAR — star recognized ────────────────────────────────────────────
export function triggerPowerStar(
  system: ParticleSystem,
  cx: number,
  cy: number,
  size: number,
): void {
  // Beams from each star point
  for (let i = 0; i < 5; i++) {
    const ang = (Math.PI / 5) * i * 2 - Math.PI / 2;
    const ex = cx + Math.cos(ang) * size * 0.7;
    const ey = cy + Math.sin(ang) * size * 0.7;
    system.emit({
      x: ex, y: ey, count: 12,
      speed: [0.05, 0.25],
      angle: [ang - 0.4, ang + 0.4],
      radius: [2, 8],
      colors: ['#ffee00', '#ffcc00', '#ffffff', '#ffe066'],
      decay: [0.6, 1.5], glow: 20, shape: 'star',
    });
  }
  // Orbiting sparkles base burst
  system.emit({
    x: cx, y: cy, count: 24,
    speed: [0.03, 0.12], radius: [3, 7],
    colors: ['#ffffff', '#ffee44', '#c8f24e'],
    decay: [0.4, 0.9], glow: 15, shape: 'circle',
  });
}

export function emitStarOrbiters(
  system: ParticleSystem,
  cx: number,
  cy: number,
  size: number,
  time: number,
): void {
  const orbitR = size * 0.8;
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI * 2 * i) / 8 + time * 0.003;
    system.emit({
      x: cx + Math.cos(ang) * orbitR,
      y: cy + Math.sin(ang) * orbitR,
      count: 1,
      speed: [0.01, 0.03], radius: [3, 5],
      colors: ['#ffffff', '#ffcc00'],
      decay: [2.5, 4.0], glow: 12, shape: 'circle',
    });
  }
}

// ─── FORCE SHIELD — triangle recognized ──────────────────────────────────────
export function triggerForceShield(
  system: ParticleSystem,
  cx: number,
  cy: number,
  size: number,
): void {
  // Perimeter pulse
  const r = size * 0.8;
  for (let i = 0; i < 3; i++) {
    const ang = (Math.PI * 2 / 3) * i - Math.PI / 2;
    system.emit({
      x: cx + Math.cos(ang) * r,
      y: cy + Math.sin(ang) * r,
      count: 15,
      speed: [0.02, 0.1],
      radius: [3, 8],
      colors: ['#5fd4d6', '#88eeff', '#ffffff'],
      decay: [0.5, 1.0], glow: 20, shape: 'ring',
    });
  }
}

export function renderShieldRipple(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  time: number,
): void {
  const maxR = size * 1.5;
  for (let ring = 0; ring < 3; ring++) {
    const phase = ((time * 0.001) + ring * 0.33) % 1;
    const r = phase * maxR;
    const alpha = Math.sin(phase * Math.PI) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(95,212,214,${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#5fd4d6';
    ctx.stroke();
    ctx.restore();
  }
}

// ─── ENERGY ARROW — arrow recognized ─────────────────────────────────────────
export function triggerEnergyArrow(
  system: ParticleSystem,
  cx: number,
  cy: number,
  size: number,
): void {
  // Exhaust trail particles
  system.emit({
    x: cx - size * 0.5, y: cy,
    count: 35,
    speed: [0.03, 0.15],
    angle: [-0.5, 0.5],
    radius: [3, 9],
    colors: ['#c8f24e', '#ffff00', '#ffffff'],
    decay: [0.5, 1.2], glow: 18, shape: 'circle',
  });
  // Arrowhead impact
  system.emit({
    x: cx + size * 0.5, y: cy,
    count: 20,
    speed: [0.05, 0.2],
    radius: [4, 10],
    colors: ['#ffffff', '#c8f24e'],
    decay: [0.8, 1.8], glow: 25, shape: 'spark',
  });
}

// ─── ENERGY CUBE — square recognized ─────────────────────────────────────────
export function triggerEnergyCube(
  system: ParticleSystem,
  cx: number,
  cy: number,
  size: number,
): void {
  // Corner sparks
  const half = size * 0.55;
  const corners = [
    { x: cx - half, y: cy - half },
    { x: cx + half, y: cy - half },
    { x: cx + half, y: cy + half },
    { x: cx - half, y: cy + half },
  ];
  for (const c of corners) {
    system.emit({
      x: c.x, y: c.y, count: 10,
      speed: [0.04, 0.18], radius: [3, 8],
      colors: ['#5fd4d6', '#88eeff', '#ffffff'],
      decay: [0.6, 1.4], glow: 20, shape: 'spark',
    });
  }
}

export function renderCubeHologram(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  rotation: number,
): void {
  const half = size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.strokeStyle = 'rgba(95,212,214,0.3)';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#5fd4d6';
  ctx.beginPath();
  ctx.rect(-half * 0.7, -half * 0.7, half * 1.4, half * 1.4);
  ctx.stroke();
  ctx.restore();
}

// ─── DOUBLE LIGHTNING — peace sign gesture ────────────────────────────────────
export function triggerDoubleStrike(
  system: ParticleSystem,
  cx: number,
  cy: number,
): void {
  for (const dx of [-40, 40]) {
    system.emit({
      x: cx + dx, y: cy, count: 35,
      speed: [0.05, 0.25],
      angle: [Math.PI * 0.3, Math.PI * 0.7],
      radius: [3, 8],
      colors: ['#ffffff', '#5fd4d6', '#88eeff'],
      decay: [0.8, 2.0], glow: 22, shape: 'spark',
    });
  }
}

// ─── BEAM ATTACK — sustained index point ─────────────────────────────────────
export function renderBeam(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  intensity: number,
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#5fd4d6';

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = `rgba(255,255,255,${0.9 * intensity})`;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = `rgba(95,212,214,${0.6 * intensity})`;
  ctx.lineWidth = 14;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = `rgba(50,100,255,${0.25 * intensity})`;
  ctx.lineWidth = 24;
  ctx.stroke();

  ctx.restore();
}

export function emitBeamParticles(
  system: ParticleSystem,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const t = Math.random();
  system.emit({
    x: fromX + dx * t, y: fromY + dy * t,
    count: 4,
    speed: [0.02, 0.08],
    radius: [2, 6],
    colors: ['#5fd4d6', '#ffffff', '#88eeff'],
    decay: [1.5, 3.0], glow: 15, shape: 'circle',
    angle: [Math.atan2(dy, dx) - 0.4, Math.atan2(dy, dx) + 0.4],
  });
  void len;
}
