import { useAppStore, selectSettings, selectMode } from '../store';
import { MODES } from '../data/packs';
import type { ModeId } from '../types';

/* ============================================================
 * Settings screen — tracking, effects, and input mode.
 *
 * The screen reads + writes the persisted store; reloading the app
 * brings every choice back. The eight non-MVP modes are intentionally
 * still selectable so people can preview the catalog — modes with
 * badge=soon currently fall back to the mouse handler in Studio.
 * ========================================================== */

export default function Settings() {
  const navigate = useAppStore((s) => s.navigate);
  const settings = useAppStore(selectSettings);
  const mode = useAppStore(selectMode);
  const setMode = useAppStore((s) => s.setMode);
  const setCalibration = useAppStore((s) => s.setCalibration);
  const setEffects = useAppStore((s) => s.setEffects);
  const resetSettings = useAppStore((s) => s.resetSettings);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        overflow: 'auto',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 80px' }}>
        <button
          onClick={() => navigate('landing')}
          style={{
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            borderRadius: 9,
            padding: '7px 13px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ← Air-Flow
        </button>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            fontSize: 'clamp(32px, 5vw, 52px)',
            marginTop: 28,
          }}
        >
          Settings
        </h1>

        {/* ── INPUT MODE ───────────────────────────────────── */}
        <Section title="Input mode" subtitle="How your hand becomes a pen. MVP modes are wired end-to-end.">
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as ModeId)}
                aria-pressed={mode === m.id}
                style={{
                  textAlign: 'left',
                  background: mode === m.id ? 'rgba(200,242,78,0.08)' : 'var(--panel)',
                  border: `1px solid ${mode === m.id ? 'var(--acid)' : 'var(--line)'}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{m.name}</strong>
                  {m.badge && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: m.badge === 'MVP' ? 'var(--acid)' : m.badge === 'beta' ? 'var(--cyan)' : 'var(--faint)',
                        border: `1px solid ${m.badge === 'MVP' ? 'var(--acid)' : 'var(--line)'}`,
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}
                    >
                      {m.badge}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 6, lineHeight: 1.45 }}>{m.hint}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* ── TRACKING ─────────────────────────────────────── */}
        <Section title="Tracking" subtitle="Pinch sensitivity, FPS target, lighting.">
          <SliderRow
            label="Pinch sensitivity"
            value={settings.calibration.pinchSensitivity}
            onChange={(v) => setCalibration({ pinchSensitivity: v })}
          />
          <ToggleRow
            label="Hand detection"
            checked={settings.calibration.handDetection}
            onChange={(v) => setCalibration({ handDetection: v })}
          />
          <SegmentRow
            label="FPS target"
            value={String(settings.calibration.fpsTarget)}
            options={['24', '30', '60']}
            onChange={(v) => setCalibration({ fpsTarget: parseInt(v, 10) as 24 | 30 | 60 })}
          />
          <ToggleRow
            label="Auto light calibration"
            checked={settings.calibration.autoLight}
            onChange={(v) => setCalibration({ autoLight: v })}
          />
        </Section>

        {/* ── EFFECTS ──────────────────────────────────────── */}
        <Section title="Effects" subtitle="Particles, glow and trails. Disable everything for Normal mode purity.">
          <ToggleRow
            label="Particles"
            checked={settings.effects.particles}
            onChange={(v) => setEffects({ particles: v })}
          />
          <ToggleRow
            label="Neon glow"
            checked={settings.effects.glow}
            onChange={(v) => setEffects({ glow: v })}
          />
          <ToggleRow
            label="Aura trails"
            checked={settings.effects.aura}
            onChange={(v) => setEffects({ aura: v })}
          />
          <ToggleRow
            label="Sound FX"
            checked={settings.effects.sound}
            onChange={(v) => setEffects({ sound: v })}
          />
        </Section>

        <button
          onClick={resetSettings}
          style={{
            marginTop: 32,
            background: 'transparent',
            color: 'var(--warn)',
            border: '1px solid var(--warn)',
            borderRadius: 9,
            padding: '10px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: 36,
        padding: '24px 0',
        borderTop: '1px solid var(--line-2)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>{subtitle}</p>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '12px 16px',
      }}
    >
      <span style={{ fontSize: 14, color: 'var(--ink)' }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: 160, accentColor: 'var(--acid)' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>
          {value}
        </span>
      </div>
    </Row>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={label}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: '1px solid var(--line)',
          background: checked ? 'var(--acid)' : 'var(--panel-2)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: checked ? '#07080b' : 'var(--muted)',
            transition: 'left 0.15s',
          }}
        />
      </button>
    </Row>
  );
}

function SegmentRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Row label={label}>
      <div style={{ display: 'flex', gap: 4, background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 9, padding: 3 }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            style={{
              background: value === opt ? 'var(--acid)' : 'transparent',
              color: value === opt ? '#07080b' : 'var(--muted)',
              border: 'none',
              padding: '5px 12px',
              borderRadius: 7,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </Row>
  );
}
