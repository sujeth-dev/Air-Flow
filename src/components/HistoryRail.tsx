import { useEffect, useRef } from 'react';
import { drawMiniglyph } from './ShapeRenderer';

export interface HistoryEntry {
  id: string;
  shape: string;
  score: number;
  at: number;
}

interface Props {
  history: HistoryEntry[];
  presenterMode: boolean;
  onDeleteShape?: (id: string) => void;
}

function GlyphCanvas({ shape }: { shape: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    drawMiniglyph(ctx, shape, 16, 16, 20);
  }, [shape]);

  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  );
}

export function HistoryRail({ history, presenterMode, onDeleteShape }: Props) {
  if (presenterMode) return null;

  return (
    <div
      aria-label="Recognition history"
      style={{
        position: 'fixed',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxHeight: '70vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {history.length === 0 && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#5b626b',
            textAlign: 'center',
            padding: '8px 4px',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          No shapes yet
        </div>
      )}
      {history.map((entry) => (
        <div
          key={entry.id}
          role="listitem"
          aria-label={`${entry.shape}, ${Math.round(entry.score * 100)}% confidence`}
          style={{
            background: '#131519',
            border: '1px solid #262a31',
            borderRadius: 10,
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            animation: 'slideIn 0.2s ease-out',
            position: 'relative',
          }}
        >
          {onDeleteShape && (
            <button
              onClick={() => onDeleteShape(entry.id)}
              aria-label={`Delete ${entry.shape}`}
              title="Delete shape"
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#5b626b',
                fontSize: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = '#ff6b6b'; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = '#5b626b'; }}
            >
              ×
            </button>
          )}
          <GlyphCanvas shape={entry.shape} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#8b9199',
              textAlign: 'center',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {entry.shape}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#c8f24e',
              textAlign: 'center',
            }}
          >
            {Math.round(entry.score * 100)}%
          </span>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideIn { from {} to {} }
        }
      `}</style>
    </div>
  );
}
