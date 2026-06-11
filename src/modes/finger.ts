/* ============================================================
 * Finger mode — current MVP path.
 *
 * Reads index-fingertip position from the hand state and treats
 * "index curled" as the pen-down signal. This mode mirrors what
 * the GestureFSM already does inside Studio; stage 2 can either
 * route Studio through this adapter, or leave the FSM in charge
 * and use this implementation as a reference.
 * ========================================================== */

import type { HandState, Point } from '../types';
import type { InputMode, PenEvent } from './types';

export class FingerMode implements InputMode {
  readonly id = 'finger' as const;
  private down = false;
  private last: Point | null = null;

  read(hand: HandState, t: number): PenEvent[] {
    if (!hand.present || hand.landmarks.length < 9) {
      return this.handlePenUp(t);
    }

    // Tip is landmark 8 in mirrored coordinates (already mirrored by tracking hook).
    const [tipX, tipY] = hand.landmarks[8];
    const point: Point = { x: 1 - tipX, y: tipY };

    // pinch < 0.06 ≈ index curled (fingertip near thumb) — pen down.
    const indexCurled = hand.pinch < 0.06;

    const events: PenEvent[] = [];

    if (indexCurled && !this.down) {
      events.push({ type: 'down', point, t });
      this.down = true;
    } else if (indexCurled && this.down) {
      events.push({ type: 'move', point, t });
    } else if (!indexCurled && this.down) {
      events.push({ type: 'up', point, t });
      this.down = false;
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
