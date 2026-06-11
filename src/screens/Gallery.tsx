import { useAppStore, selectInstalledPackIds, selectActivePack } from '../store';
import { PACKS } from '../data/packs';
import type { Pack } from '../types';

/* ============================================================
 * Gallery screen — browse + install power packs.
 *
 * Plain Ink and any pack already pre-installed in the catalog
 * stay installed forever (basic). Hard-Light and Arcane can be
 * installed/uninstalled here; selection updates the active pack
 * via the store. Persistence is handled by the store.
 * ========================================================== */

export default function Gallery() {
  const navigate = useAppStore((s) => s.navigate);
  const installedIds = useAppStore(selectInstalledPackIds);
  const activePack = useAppStore(selectActivePack);
  const installPack = useAppStore((s) => s.installPack);
  const uninstallPack = useAppStore((s) => s.uninstallPack);
  const setActivePack = useAppStore((s) => s.setActivePack);

  function isInstalled(pack: Pack): boolean {
    return pack.basic || installedIds.includes(pack.id) || pack.installed;
  }

  function isInstallable(pack: Pack): boolean {
    return !pack.basic;
  }

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
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 32px 80px' }}>
        <Header onBack={() => navigate('landing')} />

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            fontSize: 'clamp(32px, 5vw, 56px)',
            marginTop: 28,
            lineHeight: 1.05,
          }}
        >
          Power packs
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: 680, marginTop: 18, fontSize: 17 }}>
          Each pack drops a family of effects onto recognised shapes. Plain Ink stays installed forever — it's the Normal-mode backbone.
        </p>

        <div
          style={{
            marginTop: 44,
            display: 'grid',
            gap: 18,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {PACKS.map((pack) => {
            const installed = isInstalled(pack);
            const active = activePack.id === pack.id;
            return (
              <article
                key={pack.id}
                aria-label={`${pack.name} pack`}
                style={{
                  background: 'linear-gradient(180deg, var(--panel), var(--bg-2))',
                  border: `1px solid ${active ? pack.accent : 'var(--line)'}`,
                  borderRadius: 14,
                  padding: 22,
                  position: 'relative',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid var(--line)',
                    background: `linear-gradient(135deg, ${pack.accent}, ${pack.accent2})`,
                    marginBottom: 16,
                  }}
                />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {pack.name}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>{pack.tagline}</p>

                <ul style={{ listStyle: 'none', margin: '14px 0 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pack.powers.map((p) => (
                    <li
                      key={p.name}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--muted)',
                        border: '1px solid var(--line-2)',
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {p.name}
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <button
                    onClick={() => setActivePack(pack.id)}
                    disabled={!installed}
                    aria-label={`Select ${pack.name}`}
                    style={{
                      flex: 1,
                      background: active ? pack.accent : 'transparent',
                      color: active ? '#07080b' : installed ? 'var(--ink)' : 'var(--faint)',
                      border: `1px solid ${active ? pack.accent : 'var(--line)'}`,
                      borderRadius: 9,
                      padding: '9px 12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      letterSpacing: '0.06em',
                      cursor: installed ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {active ? 'Active' : 'Select'}
                  </button>
                  {isInstallable(pack) && (
                    <button
                      onClick={() =>
                        installed ? uninstallPack(pack.id) : installPack(pack.id)
                      }
                      aria-label={installed ? `Uninstall ${pack.name}` : `Install ${pack.name}`}
                      style={{
                        background: 'transparent',
                        color: installed ? 'var(--warn)' : 'var(--cyan)',
                        border: `1px solid ${installed ? 'var(--warn)' : 'var(--cyan)'}`,
                        borderRadius: 9,
                        padding: '9px 14px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                      }}
                    >
                      {installed ? 'Remove' : 'Install'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
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
  );
}
