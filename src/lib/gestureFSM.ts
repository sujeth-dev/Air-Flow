import type { Point } from './strokeUtils';

const MIN_POINTS = 8;
const PALM_FRAMES_REQUIRED = 10;
const FINGER_OPEN_HYSTERESIS = 5;

export type FSMState = 'INACTIVE' | 'ACTIVE' | 'CURSOR' | 'DRAWING' | 'RECOGNIZING';

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
  private palmFrames = 0;
  private fingerOpenFrames = 0;
  // After each palm event the palm must fully close before the next event can fire.
  // Without this guard the event re-fires every 10 frames while the hand stays open,
  // causing INACTIVE→ACTIVE→INACTIVE oscillation.
  private requirePalmClose = false;

  update(input: FSMInput): FSMOutput {
    const { handPresent, palmOpen, indexExtended, indexCurled, point } = input;

    if (!handPresent) {
      this.state = 'INACTIVE';
      this.buffer = [];
      this.palmFrames = 0;
      this.fingerOpenFrames = 0;
      this.requirePalmClose = false;
      return { state: 'INACTIVE', strokeInProgress: [], completedStroke: null };
    }

    // Palm-event edge detection with close-to-reset guard
    if (this.requirePalmClose) {
      if (!palmOpen) {
        this.requirePalmClose = false;
        this.palmFrames = 0;
      }
      // No palmEvent fires while waiting for the hand to close
    } else if (palmOpen) {
      this.palmFrames++;
    } else {
      this.palmFrames = 0;
    }

    const palmEvent = !this.requirePalmClose && this.palmFrames >= PALM_FRAMES_REQUIRED;
    if (palmEvent) {
      this.palmFrames = 0;
      this.requirePalmClose = true;
    }

    switch (this.state) {
      case 'INACTIVE':
        if (palmEvent) {
          this.state = 'ACTIVE';
        }
        return { state: this.state, strokeInProgress: [], completedStroke: null };

      case 'ACTIVE':
        if (palmEvent) {
          this.state = 'INACTIVE';
          return { state: 'INACTIVE', strokeInProgress: [], completedStroke: null };
        }
        if (indexExtended) {
          this.state = 'CURSOR';
        }
        return { state: this.state, strokeInProgress: [], completedStroke: null };

      case 'CURSOR':
        if (palmEvent) {
          this.state = 'INACTIVE';
          return { state: 'INACTIVE', strokeInProgress: [], completedStroke: null };
        }
        if (!indexExtended && !indexCurled) {
          this.state = 'ACTIVE';
          return { state: 'ACTIVE', strokeInProgress: [], completedStroke: null };
        }
        if (indexCurled) {
          this.state = 'DRAWING';
          this.buffer = [point];
          this.fingerOpenFrames = 0;
          return { state: 'DRAWING', strokeInProgress: [point], completedStroke: null };
        }
        return { state: 'CURSOR', strokeInProgress: [], completedStroke: null };

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
    this.palmFrames = 0;
    this.fingerOpenFrames = 0;
    this.requirePalmClose = false;
  }
}
