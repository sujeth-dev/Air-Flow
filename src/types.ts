/* ============================================================
 * Air-Flow — core contracts (v2)
 *
 * Single source of truth for the types that flow between layers.
 * Every input mode emits a `Stroke`; every recognizer returns
 * a `RecognizerResult`; the FSM emits a `Phase`; the dock binds
 * an `ElementId` to a `Power` to a `Pack`.
 * ========================================================== */

import type { Point } from './engine/stroke';
export type { Point } from './engine/stroke';

/* ─── Power / pack catalogue ─────────────────────────────── */

export type ElementId =
  | 'plain'
  | 'fire'
  | 'lightning'
  | 'ice'
  | 'wind'
  | 'water'
  | 'aura'
  | 'scifi'
  | 'fantasy';

export type PackKind = 'basic' | 'core' | 'energy' | 'tech' | 'magic';

export interface Power {
  /** Human-readable name for the dock chip. */
  name: string;
  /** Gesture that triggers this power (e.g. "Circle", "Freehand", "Snap"). */
  gesture: string;
  /** Which element / family it belongs to. */
  el: ElementId;
  /** Optional override colour for the ink line (used by Plain Ink swatches). */
  color?: string;
}

export interface Pack {
  id: string;
  name: string;
  tagline: string;
  /** Primary brand accent for the pack's UI. */
  accent: string;
  /** Secondary brand accent for the pack's UI. */
  accent2: string;
  /** Pack category. */
  kind: PackKind;
  /** Whether the pack has been installed from the gallery. */
  installed: boolean;
  /** Iconography hint (resolved by the Icon component). */
  icon: string;
  /** `basic = no FX` — Plain Ink behaves as the Normal-mode backbone. */
  basic?: boolean;
  powers: Power[];
}

/* ─── Input modes ─────────────────────────────────────────── */

export type ModeId =
  | 'pinch'
  | 'finger'
  | 'pen'
  | 'palm'
  | 'multi'
  | 'symbol'
  | 'body'
  | 'wand'
  | 'mouse';

export interface Mode {
  id: ModeId;
  name: string;
  hint: string;
  icon: string;
  /** MVP-grade modes are wired end-to-end; others are stubs in v2. */
  badge?: 'MVP' | 'beta' | 'soon';
}

/* ─── Hand tracking ───────────────────────────────────────── */

export type Landmark3D = readonly [number, number, number];

export interface HandState {
  /** 21 MediaPipe landmarks, x and y mirrored to the rendered video. */
  landmarks: Landmark3D[];
  /** Normalised thumb–index distance (0..1). */
  pinch: number;
  /** Whether a hand is currently detected. */
  present: boolean;
}

/* ─── Stroke ──────────────────────────────────────────────── */

export interface Stroke {
  /** Normalised canvas coordinates (0..1). */
  points: Point[];
  /** Which input mode produced the stroke (for analytics + replay). */
  modeId: ModeId;
  /** Start of the stroke, ms since epoch. */
  startedAt: number;
  /** End of the stroke, ms since epoch. */
  endedAt: number;
}

/* ─── Recognition ─────────────────────────────────────────── */

export type ShapeId =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'star'
  | 'zigzag'
  | 'spiral'
  | 'wave';

export interface RecognizerResult {
  shape: ShapeId | 'unknown';
  /** 0..1 confidence, higher is better. */
  score: number;
}

/* ─── FSM phases ──────────────────────────────────────────── */

export type Phase =
  | 'armed'      // hand ready, no pen down
  | 'drawing'    // pen down, raw line growing
  | 'snap'       // morphing raw → preset
  | 'power'      // emitting FX from a recognised shape
  | 'inking'     // Normal-mode: holding the colour line, no FX
  | 'fade';      // clearing

/* ─── Top-level screens ───────────────────────────────────── */

export type ScreenId = 'landing' | 'studio' | 'gallery' | 'settings';

/* ─── Settings ────────────────────────────────────────────── */

export interface CalibrationSettings {
  /** 0..100, pinch sensitivity. */
  pinchSensitivity: number;
  /** Toggle hand detection on/off (debug). */
  handDetection: boolean;
  /** Target frame rate cap. */
  fpsTarget: 24 | 30 | 60;
  /** Auto light calibration. */
  autoLight: boolean;
}

export interface EffectSettings {
  particles: boolean;
  glow: boolean;
  aura: boolean;
  sound: boolean;
}

export interface AppSettings {
  calibration: CalibrationSettings;
  effects: EffectSettings;
  /** Active input mode. */
  modeId: ModeId;
  /** Currently selected pack. */
  activePackId: string;
  /** Currently selected power within the active pack (name). */
  activePowerName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  calibration: {
    pinchSensitivity: 62,
    handDetection: true,
    fpsTarget: 30,
    autoLight: true,
  },
  effects: {
    particles: true,
    glow: true,
    aura: true,
    sound: false,
  },
  modeId: 'finger',
  activePackId: 'plain',
  activePowerName: 'Acid',
};
