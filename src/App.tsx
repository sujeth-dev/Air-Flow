import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandTracking, type TrackingStatus } from './hooks/useHandTracking';
import { useRecorder } from './hooks/useRecorder';
import { GestureFSM, type FSMState } from './lib/gestureFSM';
import { recognize } from './lib/dollarRecognizer';
import { CanvasStage } from './components/CanvasStage';
import { Hud } from './components/Hud';
import { HistoryRail, type HistoryEntry } from './components/HistoryRail';
import { PresenterToggle } from './components/PresenterToggle';
import { Toast } from './components/Toast';
import {
  computeShapePlacement,
  type CompletedShape,
  type MorphAnimation,
} from './components/ShapeRenderer';
import type { Point } from './lib/strokeUtils';

const ACCEPTANCE_THRESHOLD = 0.80;
const MORPH_DURATION_MS = 400;

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let nextId = 0;
function genId(): string {
  return `s${++nextId}`;
}

function OnboardingOverlay() {
  return (
    <div
      role="dialog"
      aria-label="Welcome to AirDraw"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(12,13,16,0.94)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        fontFamily: "'Hanken Grotesk', sans-serif",
      }}
    >
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          color: '#e9ece8',
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}
      >
        Air<span style={{ color: '#c8f24e' }}>Draw</span>
      </h1>
      <p style={{ color: '#8b9199', fontSize: 16, textAlign: 'center', maxWidth: 420 }}>
        Draw shapes in mid-air with your fingertip. The stroke snaps to a clean shape automatically.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <Step n={1} text="Allow camera access when prompted" />
        <Step n={2} text="Show your hand to the camera" />
        <Step n={3} text="Pinch thumb + index finger to draw" />
        <Step n={4} text="Release pinch to snap to a clean shape" />
      </div>
      <p style={{ color: '#5b626b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginTop: 8 }}>
        Good lighting helps — face a window or lamp
      </p>
      <p style={{ color: '#5b626b', fontSize: 11, fontFamily: "'JetBrains Mono', monospace' " }}>
        Supports: circle · square · triangle · line · arrow · star
      </p>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#c8f24e',
          color: '#0c0d10',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <span style={{ color: '#cfd4cf', fontSize: 14 }}>{text}</span>
    </div>
  );
}

function CameraErrorOverlay({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(12,13,16,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        fontFamily: "'Hanken Grotesk', sans-serif",
      }}
    >
      <span style={{ fontSize: 48 }} aria-hidden="true">📷</span>
      <h2
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: '#f2a93b',
          textAlign: 'center',
        }}
      >
        Camera Access Needed
      </h2>
      <p style={{ color: '#8b9199', fontSize: 15, textAlign: 'center', maxWidth: 360 }}>
        {message}
      </p>
      <p style={{ color: '#5b626b', fontSize: 13, textAlign: 'center', maxWidth: 380 }}>
        In Chrome: click the camera icon in the address bar → Allow → then reload.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#131519',
          border: '1px solid #c8f24e',
          borderRadius: 9,
          padding: '10px 22px',
          color: '#c8f24e',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Reload Page
      </button>
    </div>
  );
}

function NoHandOverlay({ status }: { status: TrackingStatus }) {
  if (status === 'tracking' || status === 'loading') return null;
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        background: 'rgba(19,21,25,0.85)',
        border: '1px solid #262a31',
        borderRadius: 12,
        padding: '10px 20px',
        color: '#8b9199',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {status === 'searching' ? '✋ Show your hand to begin' : '✋ Hand lost — move closer'}
    </div>
  );
}

export default function App() {
  const [fsmState, setFsmState] = useState<FSMState>('IDLE');
  const [strokeInProgress, setStrokeInProgress] = useState<Point[]>([]);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [completedShapes, setCompletedShapes] = useState<CompletedShape[]>([]);
  const [morphAnimations, setMorphAnimations] = useState<MorphAnimation[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fps, setFps] = useState(0);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('loading');
  const [presenterMode, setPresenterMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fsmRef = useRef(new GestureFSM());
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFpsUpdateRef = useRef(0);

  const { isRecording, start: startRecording, stop: stopRecording } = useRecorder(canvasRef);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handlePresenterToggle = useCallback(() => {
    const appRoot = document.getElementById('app-root');
    if (!presenterMode) {
      appRoot?.requestFullscreen?.().catch(() => undefined);
      appRoot?.classList.add('presenter');
      setPresenterMode(true);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
      appRoot?.classList.remove('presenter');
      setPresenterMode(false);
    }
  }, [presenterMode]);

  const handleFrame = useCallback(
    (data: {
      point: Point;
      pinchDistance: number;
      handPresent: boolean;
      fps: number;
      trackingStatus: TrackingStatus;
    }) => {
      if (showOnboarding && data.trackingStatus === 'tracking') {
        setShowOnboarding(false);
      }

      const now = performance.now();
      if (now - lastFpsUpdateRef.current > 500) {
        setFps(data.fps);
        lastFpsUpdateRef.current = now;
      }

      setTrackingStatus(data.trackingStatus);
      setCurrentPoint(data.handPresent ? data.point : null);

      const { state, strokeInProgress: sip, completedStroke } = fsmRef.current.update({
        handPresent: data.handPresent,
        pinchDistance: data.pinchDistance,
        point: data.point,
        t: now,
      });

      setFsmState(state);
      setStrokeInProgress([...sip]);

      if (completedStroke && completedStroke.length > 0) {
        const result = recognize(completedStroke);

        if (result.score >= ACCEPTANCE_THRESHOLD) {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const placement = computeShapePlacement(completedStroke, w, h);
          const id = genId();

          if (reducedMotion) {
            setCompletedShapes(prev => [
              ...prev,
              { id, shape: result.name, ...placement },
            ]);
          } else {
            const anim: MorphAnimation = {
              id,
              shape: result.name,
              sourceStroke: completedStroke,
              progress: 0,
              ...placement,
            };
            setMorphAnimations(prev => [...prev, anim]);

            const startTime = performance.now();
            function animStep() {
              const elapsed = performance.now() - startTime;
              const progress = Math.min(1, elapsed / MORPH_DURATION_MS);

              setMorphAnimations(prev =>
                prev.map(a => (a.id === id ? { ...a, progress } : a))
              );

              if (progress < 1) {
                requestAnimationFrame(animStep);
              } else {
                setMorphAnimations(prev => prev.filter(a => a.id !== id));
                setCompletedShapes(prev => [
                  ...prev,
                  { id, shape: result.name, cx: placement.cx, cy: placement.cy, size: placement.size },
                ]);
              }
            }
            requestAnimationFrame(animStep);
          }

          setHistory(prev => [
            { id, shape: result.name, score: result.score, at: Date.now() },
            ...prev.slice(0, 9),
          ]);
        } else {
          setToast(
            `Closest match: "${result.name}" (${Math.round(result.score * 100)}%) — try a cleaner stroke`
          );
        }
      }
    },
    [showOnboarding]
  );

  const { videoRef, error } = useHandTracking(handleFrame);

  if (error) return <CameraErrorOverlay message={error} />;

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)' }}>
      {showOnboarding && trackingStatus === 'loading' && <OnboardingOverlay />}

      <CanvasStage
        fsmState={fsmState}
        strokeInProgress={strokeInProgress}
        currentPoint={currentPoint}
        completedShapes={completedShapes}
        morphAnimations={morphAnimations}
        presenterMode={presenterMode}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

      <NoHandOverlay status={trackingStatus} />

      <Hud
        fps={fps}
        trackingStatus={trackingStatus}
        fsmState={fsmState}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        onRecordToggle={handleRecordToggle}
        presenterMode={presenterMode}
      />

      <HistoryRail history={history} presenterMode={presenterMode} />

      <PresenterToggle presenterMode={presenterMode} onToggle={handlePresenterToggle} />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
