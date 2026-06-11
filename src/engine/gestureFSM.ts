import type { Point } from './stroke';

const MIN_POINTS = 8;
const PALM_ACTIVATE_MS = 3000;
const HAND_LOST_GRACE_MS = 500;
const FINGER_OPEN_HYSTERESIS = 5;

export type FSMState = 'INACTIVE' | 'ACTIVE' | 'DRAWING' | 'RECOGNIZING';

export interface FSMInput {
  handPresent: boolean;
  palmOpen: boolean;
  indexExtended: boolean;
  indexCurled: boolean;
  point: Point;
  t: number;
}

export interface FSMOutput {
  state: FSMState;
  strokeInProgress: Point[];
  completedStroke: Point[] | null;
}

export class GestureFSM {
  private state: FSMState = 'INACTIVE';
  private buffer: Point[] = [];
  private palmStartTime: number | null = null;
  private fingerOpenFrames = 0;
  private requirePalmClose = false;
  private lastHandPresentTime: number = 0;

  update(input: FSMInput): FSMOutput {
    const { handPresent, palmOpen, indexCurled, point } = input;

    if (handPresent) this.lastHandPresentTime = input.t;

    const isHandReallyLost =
      !handPresent && input.t - this.lastHandPresentTime > HAND_LOST_GRACE_MS;

    if (isHandReallyLost) {
      this.state = 'INACTIVE';
      this.buffer = [];
      this.palmStartTime = null;
      this.fingerOpenFrames = 0;
      this.requirePalmClose = false;
      this.lastHandPresentTime = 0;
      return { state: 'INACTIVE', strokeInProgress: [], completedStroke: null };
    }

    // In grace period (hand briefly lost) — maintain current state, skip palm detection
    if (!handPresent) {
      return { state: this.state, strokeInProgress: [...this.buffer], completedStroke: null };
    }

    // Palm timing with close-to-reset guard
    if (this.requirePalmClose) {
      if (!palmOpen) {
        this.requirePalmClose = false;
        this.palmStartTime = null;
      }
    } else if (palmOpen) {
      if (this.palmStartTime === null) this.palmStartTime = input.t;
    } else {
      this.palmStartTime = null;
    }

    const palmEvent =
      !this.requirePalmClose &&
      this.palmStartTime !== null &&
      input.t - this.palmStartTime >= PALM_ACTIVATE_MS;

    if (palmEvent) {
      this.palmStartTime = null;
      this.requirePalmClose = true;
    }

    switch (this.state) {
      case 'INACTIVE':
        if (palmEvent) this.state = 'ACTIVE';
        return { state: this.state, strokeInProgress: [], completedStroke: null };

      case 'ACTIVE':
        if (palmEvent) {
          this.state = 'INACTIVE';
          return { state: 'INACTIVE', strokeInProgress: [], completedStroke: null };
        }
        if (indexCurled) {
          this.state = 'DRAWING';
          this.buffer = [point];
          this.fingerOpenFrames = 0;
          return { state: 'DRAWING', strokeInProgress: [point], completedStroke: null };
        }
        return { state: 'ACTIVE', strokeInProgress: [], completedStroke: null };

      case 'DRAWING': {
        if (!indexCurled) {
          this.fingerOpenFrames++;
        } else {
          this.fingerOpenFrames = 0;
          this.buffer.push(point);
        }

        if (this.fingerOpenFrames >= FINGER_OPEN_HYSTERESIS) {
          const completed = this.buffer.length >= MIN_POINTS ? [...this.buffer] : null;
          this.buffer = [];
          this.fingerOpenFrames = 0;
          this.state = 'RECOGNIZING';
          return { state: 'RECOGNIZING', strokeInProgress: [], completedStroke: completed };
        }

        return { state: 'DRAWING', strokeInProgress: [...this.buffer], completedStroke: null };
      }

      case 'RECOGNIZING':
        this.state = 'ACTIVE';
        this.buffer = [];
        return { state: 'ACTIVE', strokeInProgress: [], completedStroke: null };
    }
  }

  reset(): void {
    this.state = 'INACTIVE';
    this.buffer = [];
    this.palmStartTime = null;
    this.fingerOpenFrames = 0;
    this.requirePalmClose = false;
    this.lastHandPresentTime = 0;
  }
}
