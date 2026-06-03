import type { Point } from './strokeUtils';

const T_ON = 0.045;
const T_OFF = 0.07;
const MIN_POINTS = 8;

export type FSMState = 'IDLE' | 'ARMED' | 'DRAWING' | 'RECOGNIZING';

export interface FSMInput {
  handPresent: boolean;
  pinchDistance: number;
  point: Point;
  t: number;
}

export interface FSMOutput {
  state: FSMState;
  strokeInProgress: Point[];
  completedStroke: Point[] | null;
}

export class GestureFSM {
  private state: FSMState = 'IDLE';
  private buffer: Point[] = [];

  update(input: FSMInput): FSMOutput {
    const { handPresent, pinchDistance, point } = input;

    if (!handPresent) {
      this.state = 'IDLE';
      this.buffer = [];
      return { state: 'IDLE', strokeInProgress: [], completedStroke: null };
    }

    switch (this.state) {
      case 'IDLE':
        this.state = 'ARMED';
        this.buffer = [];
        return { state: 'ARMED', strokeInProgress: [], completedStroke: null };

      case 'ARMED':
        if (pinchDistance < T_ON) {
          this.state = 'DRAWING';
          this.buffer = [point];
          return { state: 'DRAWING', strokeInProgress: [point], completedStroke: null };
        }
        return { state: 'ARMED', strokeInProgress: [], completedStroke: null };

      case 'DRAWING':
        if (pinchDistance < T_OFF) {
          this.buffer.push(point);
          return { state: 'DRAWING', strokeInProgress: [...this.buffer], completedStroke: null };
        } else {
          const completed = this.buffer.length >= MIN_POINTS ? [...this.buffer] : null;
          this.buffer = [];
          this.state = 'ARMED';
          return { state: 'ARMED', strokeInProgress: [], completedStroke: completed };
        }

      case 'RECOGNIZING':
        this.state = 'ARMED';
        this.buffer = [];
        return { state: 'ARMED', strokeInProgress: [], completedStroke: null };
    }
  }

  reset(): void {
    this.state = 'IDLE';
    this.buffer = [];
  }
}
