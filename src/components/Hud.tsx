import type { FSMState } from '../lib/gestureFSM';
import type { TrackingStatus } from '../hooks/useHandTracking';

interface Props {
  fps: number;
  trackingStatus: TrackingStatus;
  fsmState: FSMState;
  isRecording: boolean;
  recordingSeconds: number;
  onRecordToggle: () => void;
  presenterMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  mouseModeEnabled: boolean;
  onMouseModeToggle: () => void;
  loadingProgress: number;
}

function fsmColor(state: FSMState): string {
  switch (state) {
    case 'DRAWING': return '#c8f24e';
    case 'RECOGNIZING': return '#5fd4d6';
    case 'CURSOR': return '#f2a93b';
    case 'ACTIVE': return '#8b9199';
    case 'INACTIVE': return '#5b626b';
  }
}

function fpsColor(fps: number): string {
  if (fps >= 25) return '#c8f24e';
  if (fps >= 15) return '#f2a93b';
  return '#ff6b6b';
}

function trackingLabel(status: TrackingStatus): string {
  switch (status) {
    case 'loading': return 'Loading…';
    case 'searching': return 'Searching for hand';
    case 'tracking': return 'Tracking';
    case 'lost': return 'Hand lost';
  }
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const chipStyle = {
  background: '#131519',
  border: '1px solid #262a31',
  borderRadius: 7,
  padding: '4px 9px',
  color: '#8b9199',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
} as const;

const iconBtnStyle = {
  ...chipStyle,
  cursor: 'pointer',
  transition: 'opacity 0.1s',
} as const;

export function Hud({
  fps,
  trackingStatus,
  fsmState,
  isRecording,
  recordingSeconds,
  onRecordToggle,
  presenterMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mouseModeEnabled,
  onMouseModeToggle,
  loadingProgress,
}: Props) {
  if (presenterMode) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Status information"
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      {/* Loading progress bar */}
      {trackingStatus === 'loading' && loadingProgress < 100 && (
        <div style={{ width: 180, height: 4, background: '#262a31', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${loadingProgress}%`,
            background: 'linear-gradient(90deg, #5fd4d6, #c8f24e)',
            borderRadius: 2,
            transition: 'width 0.15s ease',
          }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{ ...chipStyle, color: fpsColor(fps) }}
          aria-label={`${Math.round(fps)} frames per second`}
        >
          {Math.round(fps)} FPS
        </span>

        <span
          style={chipStyle}
          aria-label={`Tracking status: ${trackingLabel(trackingStatus)}`}
        >
          {trackingLabel(trackingStatus)}
        </span>

        <span
          style={{ ...chipStyle, color: fsmColor(fsmState), textTransform: 'uppercase', letterSpacing: '0.12em' }}
          aria-label={`Gesture state: ${fsmState}`}
        >
          {fsmState}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          style={{ ...iconBtnStyle, opacity: canUndo ? 1 : 0.35 }}
        >
          ↩ Undo
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
          style={{ ...iconBtnStyle, opacity: canRedo ? 1 : 0.35 }}
        >
          ↪ Redo
        </button>

        {/* Mouse mode */}
        <button
          onClick={onMouseModeToggle}
          aria-label={mouseModeEnabled ? 'Disable mouse mode (M)' : 'Enable mouse mode (M)'}
          title="Mouse mode (M)"
          style={{
            ...iconBtnStyle,
            borderColor: mouseModeEnabled ? '#c8f24e' : '#262a31',
            color: mouseModeEnabled ? '#c8f24e' : '#8b9199',
          }}
        >
          🖱 Mouse
        </button>
      </div>

      {/* Record */}
      <button
        onClick={onRecordToggle}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: isRecording ? '#2a0e0e' : '#131519',
          border: `1px solid ${isRecording ? '#ff4444' : '#262a31'}`,
          borderRadius: 7,
          padding: '6px 12px',
          color: isRecording ? '#ff6b6b' : '#8b9199',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isRecording ? '#ff4444' : '#8b9199',
            animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        {isRecording ? `Stop · ${formatSeconds(recordingSeconds)}` : 'Record (R)'}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
