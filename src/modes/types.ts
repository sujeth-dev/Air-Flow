/* ============================================================
 * Modes — input layer contracts.
 *
 * Each input mode turns hand landmarks into pen events:
 *
 *   read(handState, t) → PenEvent[]
 *
 * The engine consumes events through a single channel so it never
 * knows which mode drew. Stage 2 plugs the real implementations
 * behind these stubs without touching the engine or studio.
 * ========================================================== */

import type { HandState, ModeId, Point } from '../types';

export type PenEventType = 'down' | 'move' | 'up';

export interface PenEvent {
  type: PenEventType;
  /** Normalised canvas coordinate (0..1). */
  point: Point;
  /** Performance.now() timestamp in ms. */
  t: number;
  /** Optional pressure / confidence 0..1 (some modes can emit it). */
  pressure?: number;
}

export interface InputMode {
  id: ModeId;
  /**
   * Translate the current hand state into zero or more pen events.
   * Modes maintain their own internal state across frames.
   */
  read(hand: HandState, t: number): PenEvent[];
  /** Reset internal state (e.g. on mode switch or hand loss). */
  reset(): void;
}

/** A mode that doesn't yet emit events — placeholder for stage 2. */
export class StubMode implements InputMode {
  constructor(public readonly id: ModeId) {}
  read(): PenEvent[] {
    return [];
  }
  reset(): void {
    // no-op
  }
}
