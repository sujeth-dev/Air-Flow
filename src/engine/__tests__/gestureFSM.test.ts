import { describe, it, expect, beforeEach } from 'vitest';
import { GestureFSM } from '../gestureFSM';
import type { FSMInput } from '../gestureFSM';

const PT = { x: 0.5, y: 0.5 };

function baseInput(overrides: Partial<FSMInput> = {}): FSMInput {
  return {
    handPresent: true,
    palmOpen: false,
    indexExtended: false,
    indexCurled: false,
    point: PT,
    t: 0,
    ...overrides,
  };
}

// Simulates holding palm open for 3+ seconds to trigger a palm event.
// Returns the FSM to whatever state that transition yields.
function palmActivate(fsm: GestureFSM, startT: number = 0): void {
  fsm.update(baseInput({ palmOpen: true, t: startT }));
  fsm.update(baseInput({ palmOpen: true, t: startT + 3001 }));
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

  it('stays INACTIVE until palm held for 3 seconds', () => {
    // Just under 3s — no event
    fsm.update(baseInput({ palmOpen: true, t: 0 }));
    const mid = fsm.update(baseInput({ palmOpen: true, t: 2999 }));
    expect(mid.state).toBe('INACTIVE');
    // At 3001ms the event fires
    const out = fsm.update(baseInput({ palmOpen: true, t: 3001 }));
    expect(out.state).toBe('ACTIVE');
  });

  it('hand absent > 500ms from any state resets to INACTIVE', () => {
    palmActivate(fsm); // → ACTIVE
    const out = fsm.update(baseInput({ handPresent: false, t: 4000 }));
    expect(out.state).toBe('INACTIVE');
  });

  it('hand absent < 500ms (grace period) does NOT reset state', () => {
    palmActivate(fsm); // → ACTIVE, lastHandPresentTime = 3001
    // disappears for only 400ms
    const out = fsm.update(baseInput({ handPresent: false, t: 3401 }));
    expect(out.state).toBe('ACTIVE');
  });

  it('holding palm open after event does NOT re-fire (no oscillation)', () => {
    palmActivate(fsm, 0); // → ACTIVE at t=3001
    // Keep holding palm open for many more frames — must stay ACTIVE
    for (let t = 3100; t < 10000; t += 100) {
      const out = fsm.update(baseInput({ palmOpen: true, t }));
      expect(out.state).toBe('ACTIVE');
    }
  });

  it('ACTIVE → INACTIVE on second palm event (requires palm close between events)', () => {
    palmActivate(fsm, 0); // → ACTIVE
    expect(fsm.update(baseInput({ t: 3100 })).state).toBe('ACTIVE');
    // Close palm to reset the guard
    fsm.update(baseInput({ palmOpen: false, t: 3200 }));
    // Second hold for 3s to toggle off
    fsm.update(baseInput({ palmOpen: true, t: 3300 }));
    const out = fsm.update(baseInput({ palmOpen: true, t: 6400 }));
    expect(out.state).toBe('INACTIVE');
  });

  it('ACTIVE → DRAWING when index curls', () => {
    palmActivate(fsm, 0); // → ACTIVE
    const out = fsm.update(baseInput({ indexCurled: true, t: 3100 }));
    expect(out.state).toBe('DRAWING');
  });

  it('DRAWING → RECOGNIZING when index uncurls for 5 frames', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 })); // → DRAWING (1 pt)
    for (let i = 0; i < 8; i++) {
      fsm.update(baseInput({ indexCurled: true, t: 3200 + i * 10 }));
    }
    // Open for 5 frames
    let lastOut = fsm.update(baseInput({ t: 3300 }));
    for (let i = 1; i < 5; i++) {
      lastOut = fsm.update(baseInput({ t: 3300 + i * 10 }));
    }
    expect(lastOut.state).toBe('RECOGNIZING');
  });

  it('short stroke (< 8 pts) returns null completedStroke', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 })); // DRAWING (1 pt)
    fsm.update(baseInput({ indexCurled: true, t: 3110 }));
    fsm.update(baseInput({ indexCurled: true, t: 3120 }));
    // Open finger for 5 frames
    let lastOut = fsm.update(baseInput({ t: 3200 }));
    for (let i = 1; i < 5; i++) {
      lastOut = fsm.update(baseInput({ t: 3200 + i * 10 }));
    }
    expect(lastOut.state).toBe('RECOGNIZING');
    expect(lastOut.completedStroke).toBeNull();
  });

  it('full stroke (≥ 8 pts) emits completedStroke', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 })); // DRAWING (1 pt)
    for (let i = 0; i < 8; i++) {
      fsm.update(baseInput({ indexCurled: true, t: 3110 + i * 10 }));
    }
    // Open for 5 frames
    let lastOut = fsm.update(baseInput({ t: 3300 }));
    for (let i = 1; i < 5; i++) {
      lastOut = fsm.update(baseInput({ t: 3300 + i * 10 }));
    }
    expect(lastOut.state).toBe('RECOGNIZING');
    expect(lastOut.completedStroke).not.toBeNull();
    expect(lastOut.completedStroke!.length).toBeGreaterThanOrEqual(8);
  });

  it('RECOGNIZING → ACTIVE on next frame', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 }));
    for (let i = 0; i < 8; i++) fsm.update(baseInput({ indexCurled: true, t: 3110 + i * 10 }));
    for (let i = 0; i < 5; i++) fsm.update(baseInput({ t: 3300 + i * 10 })); // → RECOGNIZING
    const out = fsm.update(baseInput({ t: 3400 }));
    expect(out.state).toBe('ACTIVE');
  });

  it('reset() returns FSM to INACTIVE', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 }));
    fsm.reset();
    const out = fsm.update(baseInput({ t: 3200 }));
    expect(out.state).toBe('INACTIVE');
  });

  it('strokeInProgress grows while DRAWING', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 }));
    const out1 = fsm.update(baseInput({ indexCurled: true, t: 3110 }));
    const out2 = fsm.update(baseInput({ indexCurled: true, t: 3120 }));
    expect(out2.strokeInProgress.length).toBeGreaterThan(out1.strokeInProgress.length);
  });

  it('finger-open hysteresis: brief open mid-stroke does not stop drawing', () => {
    palmActivate(fsm, 0);
    fsm.update(baseInput({ indexCurled: true, t: 3100 }));
    for (let i = 0; i < 4; i++) fsm.update(baseInput({ indexCurled: true, t: 3110 + i * 10 }));
    // Open for only 4 frames (below hysteresis of 5)
    for (let i = 0; i < 4; i++) {
      const out = fsm.update(baseInput({ indexCurled: false, t: 3200 + i * 10 }));
      expect(out.state).toBe('DRAWING');
    }
    // Curl again — still drawing
    const out = fsm.update(baseInput({ indexCurled: true, t: 3250 }));
    expect(out.state).toBe('DRAWING');
  });
});
