/* ============================================================
 * Modes — registry.
 *
 * Map ModeId → InputMode instance. Stage 2 will swap each StubMode
 * for a real implementation; Studio looks the active mode up here
 * via the modeId from the store.
 * ========================================================== */

import type { ModeId } from '../types';
import { StubMode, type InputMode } from './types';
import { FingerMode } from './finger';
import { PinchMode } from './pinch';

export type { InputMode, PenEvent } from './types';

const registry: Record<ModeId, () => InputMode> = {
  finger: () => new FingerMode(),
  pinch:  () => new PinchMode(),
  pen:    () => new StubMode('pen'),
  palm:   () => new StubMode('palm'),
  multi:  () => new StubMode('multi'),
  symbol: () => new StubMode('symbol'),
  body:   () => new StubMode('body'),
  wand:   () => new StubMode('wand'),
  mouse:  () => new StubMode('mouse'), // mouse is handled via useMouseFallback hook, not this registry
};

/** Build a fresh instance of the named mode. */
export function createMode(id: ModeId): InputMode {
  return (registry[id] ?? registry.finger)();
}

/** Is the mode wired up end-to-end (not a stub)? */
export function isModeReady(id: ModeId): boolean {
  return id === 'finger' || id === 'pinch' || id === 'mouse';
}
