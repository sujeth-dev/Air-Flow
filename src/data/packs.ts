/* ============================================================
 * Air-Flow — power pack catalogue (v2)
 *
 * Ported verbatim from the v2 prototype's data.js, retyped against
 * src/types.ts. Plain Ink is the Normal-mode backbone (basic = no FX).
 * Elemental and Aura are pre-installed; Hard-Light and Arcane are
 * gallery-installable.
 * ========================================================== */

import type { Pack, Mode } from '../types';

export const PACKS: Pack[] = [
  {
    id: 'plain',
    name: 'Plain Ink',
    tagline: 'No powers — clean colour ink',
    accent: '#c8f24e',
    accent2: '#ffffff',
    kind: 'basic',
    installed: true,
    basic: true,
    icon: 'pen',
    powers: [
      { name: 'Acid',   gesture: 'Freehand', el: 'plain', color: '#c8f24e' },
      { name: 'Cyan',   gesture: 'Freehand', el: 'plain', color: '#5fd4d6' },
      { name: 'Violet', gesture: 'Freehand', el: 'plain', color: '#a78bfa' },
      { name: 'Coral',  gesture: 'Freehand', el: 'plain', color: '#ff6a2b' },
      { name: 'Pink',   gesture: 'Freehand', el: 'plain', color: '#f472b6' },
      { name: 'White',  gesture: 'Freehand', el: 'plain', color: '#ffffff' },
    ],
  },
  {
    id: 'elemental',
    name: 'Elemental',
    tagline: 'The five primal forces',
    accent: '#ff6a2b',
    accent2: '#7cc4ff',
    kind: 'core',
    installed: true,
    icon: 'flame',
    powers: [
      { name: 'Fire',      gesture: 'Circle',    el: 'fire' },
      { name: 'Lightning', gesture: 'Zigzag',    el: 'lightning' },
      { name: 'Ice',       gesture: 'Snowflake', el: 'ice' },
      { name: 'Wind',      gesture: 'Spiral',    el: 'wind' },
      { name: 'Water',     gesture: 'Wave',      el: 'water' },
    ],
  },
  {
    id: 'aura',
    name: 'Ascendant Aura',
    tagline: 'Charge, surge, overdrive',
    accent: '#c084fc',
    accent2: '#f5d76e',
    kind: 'energy',
    installed: true,
    icon: 'aura',
    powers: [
      { name: 'Ignition',  gesture: 'Hold fist',  el: 'aura' },
      { name: 'Surge Beam', gesture: 'Push palms', el: 'aura' },
      { name: 'Star Cell',  gesture: 'Cup hands',  el: 'aura' },
      { name: 'Overdrive',  gesture: 'Flex arms',  el: 'aura' },
      { name: 'Blink',      gesture: 'Snap',       el: 'aura' },
    ],
  },
  {
    id: 'scifi',
    name: 'Hard-Light',
    tagline: 'Lasers, plasma & holo-steel',
    accent: '#2dd4bf',
    accent2: '#a7fff2',
    kind: 'tech',
    installed: false,
    icon: 'bolt',
    powers: [
      { name: 'Pulse Laser', gesture: 'Point',     el: 'scifi' },
      { name: 'Holo-Blade',  gesture: 'Slash',     el: 'scifi' },
      { name: 'Plasma Bolt', gesture: 'Flick',     el: 'scifi' },
      { name: 'Hard Shield', gesture: 'Open palm', el: 'scifi' },
      { name: 'EMP',         gesture: 'Clap',      el: 'scifi' },
    ],
  },
  {
    id: 'fantasy',
    name: 'Arcane',
    tagline: 'Runes, sigils & summoning',
    accent: '#f472b6',
    accent2: '#c4b5fd',
    kind: 'magic',
    installed: false,
    icon: 'rune',
    powers: [
      { name: 'Rune Circle',  gesture: 'Circle',   el: 'fantasy' },
      { name: 'Summon Sigil', gesture: 'Star',     el: 'fantasy' },
      { name: 'Warp Portal',  gesture: 'Spiral',   el: 'fantasy' },
      { name: 'Ward',         gesture: 'Hexagon',  el: 'fantasy' },
      { name: 'Frost Glyph',  gesture: 'Triangle', el: 'fantasy' },
    ],
  },
];

export const MODES: Mode[] = [
  { id: 'pinch',  name: 'Pinch Draw',     hint: 'Thumb + index pinch to put the pen down. Release to snap.',           icon: 'pinch',  badge: 'MVP' },
  { id: 'finger', name: 'Finger Draw',    hint: 'Point one finger — draw instantly, no pinch needed.',                 icon: 'finger', badge: 'MVP' },
  { id: 'pen',    name: 'Air Pen',        hint: 'Fingertip becomes a precision laser pen with a visible beam.',        icon: 'pen',    badge: 'beta' },
  { id: 'palm',   name: 'Palm Paint',     hint: 'Whole-palm movement lays down broad expressive strokes.',             icon: 'palm',   badge: 'soon' },
  { id: 'multi',  name: 'Multi-Finger',   hint: '2=line · 3=triangle · 4=square · 5=star. Instant shapes.',             icon: 'multi',  badge: 'soon' },
  { id: 'symbol', name: 'Gesture Symbols',hint: 'Z = lightning · O = shield · S = snake · X = destroy.',               icon: 'symbol', badge: 'soon' },
  { id: 'body',   name: 'Body Draw',      hint: 'Use the full arm — conduct strokes like an orchestra.',                icon: 'body',   badge: 'soon' },
  { id: 'wand',   name: 'Magic Wand',     hint: 'Hold a pen, stick or pointer — the camera tracks the object.',         icon: 'wand',   badge: 'soon' },
  { id: 'mouse',  name: 'Mouse Fallback', hint: 'Draw with your mouse. No camera required.',                            icon: 'mouse',  badge: 'MVP' },
];

/** Lookup a pack by id; returns the Plain Ink default if not found. */
export function packById(id: string): Pack {
  return PACKS.find((p) => p.id === id) ?? PACKS[0];
}

/** All packs that are currently installed (kind === plain stays installed forever). */
export function installedPacks(installedIds: string[]): Pack[] {
  return PACKS.filter((p) => p.basic || installedIds.includes(p.id));
}
