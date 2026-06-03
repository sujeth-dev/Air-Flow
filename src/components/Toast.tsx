import { useEffect } from 'react';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: '#15130e',
        border: '1px solid #f2a93b',
        borderRadius: 10,
        padding: '10px 18px',
        color: '#e4dccb',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        maxWidth: '90vw',
        textAlign: 'center',
        animation: 'toastIn 0.2s ease-out',
        pointerEvents: 'none',
      }}
    >
      {message}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes toastIn { from {} to {} }
        }
      `}</style>
    </div>
  );
}
