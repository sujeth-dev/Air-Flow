/* ============================================================
 * Pinch mode — thumb + index distance as pen down/up.
 *
 * Pen goes down when pinch distance crosses below DOWN_THRESHOLD,
 * comes up when it crosses above UP_THRESHOLD. The hysteresis
 * gap absorbs hand jitter near the boundary.
 * ========================================================== */

import type { HandState, Point } from '../types';
import type { InputMode, PenEvent } from './types';

const DOWN_THRESHOLD = 0.05;
const UP_THRESHOLD = 0.09;

export class PinchMode implements InputMode {
  readonly id = 'pinch' as const;
  private down = false;
  private last: Point | null = null;

  read(hand: HandState, t: number): PenEvent[] {
    if (!hand.present || hand.landmarks.length < 9) {
      return this.handlePenUp(t);
    }

    const [tipX, tipY] = hand.landmarks[8];
    const [thumbX, thumbY] = hand.landmarks[4];
    // Pinch point is the midpoint of thumb tip + index tip.
    const point: Point = {
      x: 1 - (tipX + thumbX) / 2,
      y: (tipY + thumbY) / 2,
    };

    const events: PenEvent[] = [];

    if (!this.down && hand.pinch < DOWN_THRESHOLD) {
      events.push({ type: 'down', point, t });
      this.down = true;
    } else if (this.down && hand.pinch > UP_THRESHOLD) {
      events.push({ type: 'up', point, t });
      this.down = false;
    } else if (this.down) {
      events.push({ type: 'move', point, t });
    }

    this.last = point;
    return events;
  }

  reset(): void {
    this.down = false;
    this.last = null;
  }

  private handlePenUp(t: number): PenEvent[] {
    if (this.down && this.last) {
      const evt: PenEvent = { type: 'up', point: this.last, t };
      this.down = false;
      return [evt];
    }
    return [];
  }
}
