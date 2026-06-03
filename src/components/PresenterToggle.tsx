interface Props {
  presenterMode: boolean;
  onToggle: () => void;
}

export function PresenterToggle({ presenterMode, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={presenterMode ? 'Exit presenter mode' : 'Enter presenter mode'}
      aria-pressed={presenterMode}
      style={{
        position: 'fixed',
        top: 16,
        right: presenterMode ? 16 : 72,
        zIndex: 40,
        background: presenterMode ? '#1a1f0a' : '#131519',
        border: `1px solid ${presenterMode ? '#c8f24e' : '#262a31'}`,
        borderRadius: 9,
        padding: '7px 14px',
        color: presenterMode ? '#c8f24e' : '#8b9199',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        transition: 'all 0.15s ease',
      }}
    >
      <span aria-hidden="true">{presenterMode ? '⊠' : '⊡'}</span>
      {presenterMode ? 'Exit' : 'Present'}
    </button>
  );
}
