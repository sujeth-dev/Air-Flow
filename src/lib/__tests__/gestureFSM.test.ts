import { describe, it, expect, beforeEach } from 'vitest';
import { GestureFSM } from '../gestureFSM';
import type { FSMInput } from '../gestureFSM';

const PT = { x: 0.5, y: 0.5 };
const T = 0;

function baseInput(overrides: Partial<FSMInput> = {}): FSMInput {
  return {
    handPresent: true,
    palmOpen: false,
    indexExtended: false,
    indexCurled: false,
    point: PT,
    t: T,
    ...overrides,
  };
}

function palmOpenFrames(fsm: GestureFSM, n: number): void {
  for (let i = 0; i < n; i++) {
    fsm.update(baseInput({ palmOpen: true }));
  }
}

describe('GestureFSM', () => {
  let fsm: GestureFSM;

  beforeEach(() => {
    fsm = new GestureFSM();
  });

  it('starts in INACTIVE', () => {
    const out = fsm.update(baseInput());
    expect(out.state).toBe('INACTIVE');
  });

  it('stays INACTIVE until 10 consecutive palm-open frames', () => {
    for (let i = 0; i < 9; i++) {
      const out = fsm.update(baseInput({ palmOpen: true }));
      expect(out.state).toBe('INACTIVE');
    }
    const out = fsm.update(baseInput({ palmOpen: true }));
    expect(out.state).toBe('ACTIVE');
  });

  it('hand absent from any state returns INACTIVE', () => {
    palmOpenFrames(fsm, 10); // → ACTIVE
    const out = fsm.update(baseInput({ handPresent: false }));
    expect(out.state).toBe('INACTIVE');
  });

  it('holding palm open after event does NOT re-fire (no oscillation)', () => {
    palmOpenFrames(fsm, 10); // → ACTIVE
    // Keep holding palm open for 30 more frames — must stay ACTIVE
    for (let i = 0; i < 30; i++) {
      const out = fsm.update(baseInput({ palmOpen: true }));
      expect(out.state).toBe('ACTIVE');
    }
  });

  it('ACTIVE → INACTIVE on second palm-open event (requires palm close between events)', () => {
    palmOpenFrames(fsm, 10); // → ACTIVE
    expect(fsm.update(baseInput()).state).toBe('ACTIVE');
    // Close the palm (requirePalmClose resets)
    fsm.update(baseInput({ palmOpen: false }));
    fsm.update(baseInput({ palmOpen: false }));
    // Now hold palm open again to toggle off
    palmOpenFrames(fsm, 10);
    expect(fsm.update(baseInput()).state).toBe('INACTIVE');
  });

  it('ACTIVE → CURSOR when index is extended', () => {
    palmOpenFrames(fsm, 10);
    const out = fsm.update(baseInput({ indexExtended: true }));
    expect(out.state).toBe('CURSOR');
  });

  it('CURSOR → DRAWING when index curls', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true })); // → CURSOR
    const out = fsm.update(baseInput({ indexCurled: true }));
    expect(out.state).toBe('DRAWING');
  });

  it('short stroke (< 8 pts) returns null completedStroke', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true })); // CURSOR
    fsm.update(baseInput({ indexCurled: true })); // DRAWING (1 pt)
    // Only 3 total points (1 from start + 2 more while curled)
    fsm.update(baseInput({ indexCurled: true }));
    fsm.update(baseInput({ indexCurled: true }));
    // Open finger for FINGER_OPEN_HYSTERESIS (5) frames
    let lastOut = fsm.update(baseInput());
    for (let i = 1; i < 5; i++) {
      lastOut = fsm.update(baseInput());
    }
    expect(lastOut.state).toBe('RECOGNIZING');
    expect(lastOut.completedStroke).toBeNull();
  });

  it('full stroke (≥ 8 pts) emits completedStroke', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true })); // CURSOR
    fsm.update(baseInput({ indexCurled: true })); // DRAWING (1 pt)
    for (let i = 0; i < 8; i++) {
      fsm.update(baseInput({ indexCurled: true }));
    }
    // Open finger for 5 frames
    let lastOut = fsm.update(baseInput());
    for (let i = 1; i < 5; i++) {
      lastOut = fsm.update(baseInput());
    }
    expect(lastOut.state).toBe('RECOGNIZING');
    expect(lastOut.completedStroke).not.toBeNull();
    expect(lastOut.completedStroke!.length).toBeGreaterThanOrEqual(8);
  });

  it('RECOGNIZING → ACTIVE on next frame', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true }));
    fsm.update(baseInput({ indexCurled: true }));
    for (let i = 0; i < 8; i++) fsm.update(baseInput({ indexCurled: true }));
    for (let i = 0; i < 5; i++) fsm.update(baseInput()); // → RECOGNIZING
    const out = fsm.update(baseInput());
    expect(out.state).toBe('ACTIVE');
  });

  it('reset() returns FSM to INACTIVE', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true }));
    fsm.reset();
    const out = fsm.update(baseInput());
    expect(out.state).toBe('INACTIVE');
  });

  it('strokeInProgress grows while DRAWING', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true }));
    fsm.update(baseInput({ indexCurled: true }));
    const out1 = fsm.update(baseInput({ indexCurled: true }));
    const out2 = fsm.update(baseInput({ indexCurled: true }));
    expect(out2.strokeInProgress.length).toBeGreaterThan(out1.strokeInProgress.length);
  });

  it('finger-open hysteresis: brief open mid-stroke does not stop drawing', () => {
    palmOpenFrames(fsm, 10);
    fsm.update(baseInput({ indexExtended: true }));
    fsm.update(baseInput({ indexCurled: true }));
    for (let i = 0; i < 4; i++) fsm.update(baseInput({ indexCurled: true }));
    // Open for only 4 frames (below hysteresis of 5)
    for (let i = 0; i < 4; i++) {
      const out = fsm.update(baseInput({ indexCurled: false }));
      expect(out.state).toBe('DRAWING');
    }
    // Curl again — still drawing
    const out = fsm.update(baseInput({ indexCurled: true }));
    expect(out.state).toBe('DRAWING');
  });
});
