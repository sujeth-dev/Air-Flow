function lowPassAlpha(cutoff: number, dt: number): number {
  const tau = 1.0 / (2 * Math.PI * cutoff);
  return 1.0 / (1.0 + tau / dt);
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private prevValue: number | null = null;
  private prevDeriv: number = 0;
  private prevT: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.015, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  filter(value: number, timestampMs: number): number {
    if (this.prevT === null || this.prevValue === null) {
      this.prevT = timestampMs;
      this.prevValue = value;
      return value;
    }

    const dt = Math.max((timestampMs - this.prevT) / 1000, 1e-6);
    this.prevT = timestampMs;

    const alphaD = lowPassAlpha(this.dCutoff, dt);
    const deriv = (value - this.prevValue) / dt;
    const smoothedDeriv = alphaD * deriv + (1 - alphaD) * this.prevDeriv;
    this.prevDeriv = smoothedDeriv;

    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedDeriv);
    const alpha = lowPassAlpha(cutoff, dt);
    const filtered = alpha * value + (1 - alpha) * this.prevValue;
    this.prevValue = filtered;

    return filtered;
  }

  reset(): void {
    this.prevValue = null;
    this.prevDeriv = 0;
    this.prevT = null;
  }
}
