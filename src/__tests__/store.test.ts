import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store';
import { DEFAULT_SETTINGS } from '../types';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset to a known state before each test.
    localStorage.clear();
    useAppStore.setState({
      screen: 'landing',
      settings: DEFAULT_SETTINGS,
      installedPackIds: ['elemental', 'aura'],
    });
  });

  it('starts on the landing screen', () => {
    expect(useAppStore.getState().screen).toBe('landing');
  });

  it('navigate() switches the screen', () => {
    useAppStore.getState().navigate('studio');
    expect(useAppStore.getState().screen).toBe('studio');
  });

  it('setMode() updates the active input mode', () => {
    useAppStore.getState().setMode('pinch');
    expect(useAppStore.getState().settings.modeId).toBe('pinch');
  });

  it('setActivePack() updates the active pack and resets the power to the first', () => {
    useAppStore.getState().setActivePack('elemental');
    const s = useAppStore.getState().settings;
    expect(s.activePackId).toBe('elemental');
    expect(s.activePowerName).toBe('Fire');
  });

  it('installPack() / uninstallPack() roundtrip', () => {
    useAppStore.getState().installPack('scifi');
    expect(useAppStore.getState().installedPackIds).toContain('scifi');

    useAppStore.getState().uninstallPack('scifi');
    expect(useAppStore.getState().installedPackIds).not.toContain('scifi');
  });

  it('installPack() is idempotent — no duplicates', () => {
    const before = useAppStore.getState().installedPackIds.length;
    useAppStore.getState().installPack('elemental');
    useAppStore.getState().installPack('elemental');
    expect(useAppStore.getState().installedPackIds.length).toBe(before);
  });

  it('setCalibration() merges into existing calibration', () => {
    useAppStore.getState().setCalibration({ pinchSensitivity: 90 });
    const c = useAppStore.getState().settings.calibration;
    expect(c.pinchSensitivity).toBe(90);
    // Other calibration fields untouched
    expect(c.handDetection).toBe(DEFAULT_SETTINGS.calibration.handDetection);
  });

  it('setEffects() merges into existing effects', () => {
    useAppStore.getState().setEffects({ particles: false });
    const e = useAppStore.getState().settings.effects;
    expect(e.particles).toBe(false);
    expect(e.glow).toBe(DEFAULT_SETTINGS.effects.glow);
  });

  it('resetSettings() restores defaults', () => {
    useAppStore.getState().setCalibration({ pinchSensitivity: 1 });
    useAppStore.getState().resetSettings();
    expect(useAppStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});
