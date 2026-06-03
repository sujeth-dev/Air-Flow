import { useEffect, useRef, useCallback } from 'react';
import type { FSMState } from '../lib/gestureFSM';
import type { Point } from '../lib/strokeUtils';
import type { CompletedShape, MorphAnimation } from './ShapeRenderer';
import { renderFrame } from './ShapeRenderer';

interface Props {
  fsmState: FSMState;
  strokeInProgress: Point[];
  currentPoint: Point | null;
  completedShapes: CompletedShape[];
  morphAnimations: MorphAnimation[];
  presenterMode: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CanvasStage({
  fsmState,
  strokeInProgress,
  currentPoint,
  completedShapes,
  morphAnimations,
  presenterMode,
  videoRef,
  canvasRef,
}: Props) {
  const rafRef = useRef<number | null>(null);

  const stateRef = useRef({
    fsmState,
    strokeInProgress,
    currentPoint,
    completedShapes,
    morphAnimations,
  });
  stateRef.current = { fsmState, strokeInProgress, currentPoint, completedShapes, morphAnimations };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    renderFrame(ctx, {
      ...stateRef.current,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      reducedMotion,
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [canvasRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const videoOpacity = presenterMode ? 0 : 0.18;

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          opacity: videoOpacity,
          filter: 'brightness(0.6)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        aria-label="Drawing canvas"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
