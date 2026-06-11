export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  radius: number;
  color: string;
  glow: number;
  shape: 'circle' | 'spark' | 'ring' | 'star';
  rotation?: number;
  rotSpeed?: number;
}

export interface EmitOpts {
  x: number;
  y: number;
  count: number;
  speed: [number, number];
  angle?: [number, number];
  radius: [number, number];
  colors: string[];
  decay: [number, number];
  glow?: number;
  shape?: Particle['shape'];
  gravity?: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  private gravity = 0;

  emit(opts: EmitOpts): void {
    const { x, y, count, speed, radius, colors, decay, glow = 0, shape = 'circle', angle } = opts;
    for (let i = 0; i < count; i++) {
      const ang = angle
        ? rand(angle[0], angle[1])
        : Math.random() * Math.PI * 2;
      const spd = rand(speed[0], speed[1]);
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: rand(decay[0], decay[1]),
        radius: rand(radius[0], radius[1]),
        color: colors[Math.floor(Math.random() * colors.length)],
        glow,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
      });
    }
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx * dtMs;
      p.y += p.vy * dtMs;
      p.vy += this.gravity * dt;
      p.life -= p.decay * dt;
      if (p.rotation !== undefined && p.rotSpeed !== undefined) {
        p.rotation += p.rotSpeed;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      const alpha = Math.max(0, p.life);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = p.glow;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'spark': {
          const len = p.radius * 3;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation ?? 0);
          ctx.lineWidth = p.radius * 0.5;
          ctx.beginPath();
          ctx.moveTo(-len, 0);
          ctx.lineTo(len, 0);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'ring':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.stroke();
          break;

        case 'star': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation ?? 0);
          drawStar(ctx, 0, 0, 5, p.radius, p.radius * 0.4);
          ctx.fill();
          ctx.restore();
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  clear(): void {
    this.particles = [];
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  spikes: number,
  outerR: number,
  innerR: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
}
