
interface Props {
  progress: number; // 0–100
  phase: 'downloading' | 'initializing';
}

export function LoadingOverlay({ progress, phase }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(12,13,16,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1.5rem', fontFamily: "'Hanken Grotesk', sans-serif",
    }}>
      <div style={{ fontSize: '2rem', color: '#c8f24e', fontWeight: 700 }}>
        Air<span style={{ color: '#5fd4d6' }}>Draw</span>
      </div>

      {phase === 'downloading' ? (
        <>
          <div style={{ color: '#8b9199', fontSize: '0.9rem' }}>
            Loading hand tracking model…
          </div>
          <div style={{
            width: 280, height: 6, background: '#262a31',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #5fd4d6, #c8f24e)',
              borderRadius: 3,
              transition: 'width 0.15s ease',
            }} />
          </div>
          <div style={{ color: '#8b9199', fontSize: '0.8rem' }}>
            {progress}%
          </div>
        </>
      ) : (
        <>
          <div style={{ color: '#8b9199', fontSize: '0.9rem' }}>
            Initializing…
          </div>
          <div style={{
            width: 32, height: 32, border: '3px solid #262a31',
            borderTopColor: '#c8f24e', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
