import { useAppStore } from '../store';

/* ============================================================
 * Landing screen — the entry point.
 *
 * Three calls to action: open Studio, browse the Gallery, tweak
 * Settings. The hero copy is straight from the v2 prototype.
 * ========================================================== */

const features = [
  { tag: 'Air drawing',    body: 'Pinch, point or sweep — eight ways to put a pen down in mid-air.' },
  { tag: 'AI recognition', body: 'Messy stroke → snapped preset in under 50 ms, on-device.' },
  { tag: 'Power packs',    body: 'Drop elemental, aura, hard-light and arcane effects on any shape.' },
];

export default function Landing() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        overflow: 'auto',
        background:
          'radial-gradient(60% 50% at 12% -5%, rgba(167,139,250,.14), transparent 60%),' +
          'radial-gradient(50% 40% at 95% 0%, rgba(95,212,214,.10), transparent 60%),' +
          'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '88px 32px 80px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--acid)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 11,
          }}
        >
          <span style={{ width: 30, height: 1, background: 'var(--acid)' }} />
          Touchless creation engine
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            fontSize: 'clamp(40px, 7vw, 78px)',
            lineHeight: 1.02,
            margin: '24px 0 0',
          }}
        >
          Air<em style={{ fontStyle: 'normal', color: 'var(--acid)', textShadow: '0 0 34px rgba(200,242,78,.35)' }}>-Flow</em>
          <br />
          draws what your hand thinks.
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: 19, marginTop: 26, maxWidth: 640, textWrap: 'pretty' }}>
          Open the camera, hold up a hand, and draw in mid-air. Crisp shapes snap from wobbly strokes; power packs ignite them with elemental FX. No surface, no stylus, nothing to install.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('studio')}
            style={{
              background: 'var(--acid)',
              color: '#07080b',
              border: 'none',
              borderRadius: 11,
              padding: '14px 26px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 0 32px rgba(200,242,78,.35)',
            }}
          >
            Enter Studio →
          </button>
          <button
            onClick={() => navigate('gallery')}
            style={{
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 11,
              padding: '14px 22px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Browse Packs
          </button>
          <button
            onClick={() => navigate('settings')}
            style={{
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--line)',
              borderRadius: 11,
              padding: '14px 22px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Settings
          </button>
        </div>

        <div
          style={{
            marginTop: 64,
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {features.map((f) => (
            <div
              key={f.tag}
              style={{
                background: 'linear-gradient(180deg, var(--panel), var(--bg-2))',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: 22,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--cyan)',
                }}
              >
                {f.tag}
              </span>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, marginTop: 10, lineHeight: 1.55 }}>{f.body}</p>
            </div>
          ))}
        </div>

        <p
          style={{
            color: 'var(--faint)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            marginTop: 60,
            letterSpacing: '0.06em',
          }}
        >
          v2 · client-only · runs in any modern browser with a webcam.
        </p>
      </div>
    </div>
  );
}
