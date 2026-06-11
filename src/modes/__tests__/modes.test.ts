import { describe, it, expect } from 'vitest';
import { FingerMode } from '../finger';
import { PinchMode } from '../pinch';
import { StubMode } from '../types';
import { createMode, isModeReady } from '../index';
import type { HandState, Landmark3D } from '../../types';

function hand(present: boolean, pinch: number, tip?: Landmark3D, thumb?: Landmark3D): HandState {
  const tipLm: Landmark3D = tip ?? [0.5, 0.5, 0];
  const thumbLm: Landmark3D = thumb ?? [0.5, 0.5, 0];
  // Fill 21 landmarks with a sane default; indices 4 and 8 are what the modes use.
  const lm: Landmark3D[] = Array.from({ length: 21 }, () => [0, 0, 0] as Landmark3D);
  lm[4] = thumbLm;
  lm[8] = tipLm;
  return { landmarks: lm, pinch, present };
}

describe('FingerMode', () => {
  it('emits down → move → up across frames', () => {
    const m = new FingerMode();
    const a = m.read(hand(true, 0.04, [0.5, 0.5, 0]), 0);
    const b = m.read(hand(true, 0.04, [0.6, 0.5, 0]), 16);
    const c = m.read(hand(true, 0.20, [0.6, 0.5, 0]), 32);

    expect(a.map((e) => e.type)).toEqual(['down']);
    expect(b.map((e) => e.type)).toEqual(['move']);
    expect(c.map((e) => e.type)).toEqual(['up']);
  });

  it('emits up when hand disappears mid-stroke', () => {
    const m = new FingerMode();
    m.read(hand(true, 0.03), 0);
    const out = m.read(hand(false, 0.03), 16);
    expect(out.map((e) => e.type)).toEqual(['up']);
  });

  it('reset() drops the down state', () => {
    const m = new FingerMode();
    m.read(hand(true, 0.03), 0);
    m.reset();
    const out = m.read(hand(true, 0.5), 16);
    expect(out).toEqual([]);
  });
});

describe('PinchMode', () => {
  it('hysteresis: stays down until pinch crosses UP_THRESHOLD', () => {
    const m = new PinchMode();
    expect(m.read(hand(true, 0.04), 0).map((e) => e.type)).toEqual(['down']);
    // pinch widens to 0.07 — between DOWN and UP — stays drawing
    expect(m.read(hand(true, 0.07), 16).map((e) => e.type)).toEqual(['move']);
    // pinch widens past UP — releases
    expect(m.read(hand(true, 0.10), 32).map((e) => e.type)).toEqual(['up']);
  });

  it('point is midpoint of thumb and index tip', () => {
    const m = new PinchMode();
    const out = m.read(hand(true, 0.04, [0.4, 0.5, 0], [0.6, 0.5, 0]), 0);
    expect(out[0].point.x).toBeCloseTo(1 - 0.5);
    expect(out[0].point.y).toBeCloseTo(0.5);
  });
});

describe('StubMode', () => {
  it('emits no events and is a no-op on reset', () => {
    const m = new StubMode('pen');
    expect(m.read()).toEqual([]);
    m.reset();
    expect(m.read()).toEqual([]);
  });
});

describe('registry', () => {
  it('createMode returns the requested implementation', () => {
    expect(createMode('finger')).toBeInstanceOf(FingerMode);
    expect(createMode('pinch')).toBeInstanceOf(PinchMode);
    expect(createMode('pen')).toBeInstanceOf(StubMode);
  });

  it('isModeReady distinguishes MVP modes from stubs', () => {
    expect(isModeReady('finger')).toBe(true);
    expect(isModeReady('pinch')).toBe(true);
    expect(isModeReady('mouse')).toBe(true);
    expect(isModeReady('pen')).toBe(false);
    expect(isModeReady('symbol')).toBe(false);
  });
});
