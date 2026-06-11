/* ============================================================
 * Air-Flow — global store (v2)
 *
 * One Zustand store, four facets:
 *   1. Navigation (current screen)
 *   2. Active mode / pack / power
 *   3. Installed-pack catalog
 *   4. Settings (calibration + effects)
 *
 * Settings & installed packs are persisted to localStorage so the
 * user's setup survives a reload. Live engine state (FSM, hand pose,
 * stroke buffer) stays in the Studio component — the store is for
 * cross-screen, slow-changing app state only.
 * ========================================================== */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ScreenId,
  type ModeId,
  type Pack,
} from './types';
import { PACKS, packById } from './data/packs';

const STORAGE_KEY = 'airflow-v2';

interface AppState {
  /** Current top-level screen. */
  screen: ScreenId;
  /** Persisted app settings. */
  settings: AppSettings;
  /** Pack ids the user has installed (excluding basic packs, which are always installed). */
  installedPackIds: string[];

  // ── Navigation
  navigate: (screen: ScreenId) => void;

  // ── Mode / pack / power
  setMode: (modeId: ModeId) => void;
  setActivePack: (packId: string) => void;
  setActivePower: (powerName: string) => void;

  // ── Pack install
  installPack: (packId: string) => void;
  uninstallPack: (packId: string) => void;

  // ── Settings
  setCalibration: (patch: Partial<AppSettings['calibration']>) => void;
  setEffects: (patch: Partial<AppSettings['effects']>) => void;
  resetSettings: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      screen: 'landing',
      settings: DEFAULT_SETTINGS,
      installedPackIds: PACKS.filter((p) => p.installed && !p.basic).map((p) => p.id),

      navigate: (screen) => set({ screen }),

      setMode: (modeId) =>
        set((s) => ({ settings: { ...s.settings, modeId } })),

      setActivePack: (packId) =>
        set((s) => {
          const pack = packById(packId);
          const power = pack.powers[0]?.name ?? s.settings.activePowerName;
          return {
            settings: { ...s.settings, activePackId: packId, activePowerName: power },
          };
        }),

      setActivePower: (powerName) =>
        set((s) => ({ settings: { ...s.settings, activePowerName: powerName } })),

      installPack: (packId) =>
        set((s) =>
          s.installedPackIds.includes(packId)
            ? s
            : { installedPackIds: [...s.installedPackIds, packId] },
        ),

      uninstallPack: (packId) =>
        set((s) => ({
          installedPackIds: s.installedPackIds.filter((id) => id !== packId),
        })),

      setCalibration: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            calibration: { ...s.settings.calibration, ...patch },
          },
        })),

      setEffects: (patch) =>
        set((s) => ({
          settings: { ...s.settings, effects: { ...s.settings.effects, ...patch } },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist these slices — screen is transient, derived data isn't.
      partialize: (s) => ({
        settings: s.settings,
        installedPackIds: s.installedPackIds,
      }),
      version: 1,
    },
  ),
);

/* ─── Selectors (use these in components; avoid `useAppStore()` whole-state) ─ */

export const selectScreen = (s: AppState): ScreenId => s.screen;
export const selectSettings = (s: AppState): AppSettings => s.settings;
export const selectMode = (s: AppState): ModeId => s.settings.modeId;
export const selectActivePack = (s: AppState): Pack =>
  packById(s.settings.activePackId);
export const selectActivePowerName = (s: AppState): string =>
  s.settings.activePowerName;
export const selectInstalledPackIds = (s: AppState): string[] => s.installedPackIds;
