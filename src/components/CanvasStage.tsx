import { useEffect, useLayoutEffect, useRef } from 'react';
import type { FSMState } from '../lib/gestureFSM';
import type { Point } from '../lib/strokeUtils';
import type { CompletedShape, MorphAnimation } from './ShapeRenderer';
import { renderFrame } from './ShapeRenderer';
import { hitTestAllShapes } from './SelectionLayer';

interface Props {
  fsmState: FSMState;
  strokeInProgress: Point[];
  currentPoint: Point | null;
  completedShapes: CompletedShape[];
  morphAnimations: MorphAnimation[];
  presenterMode: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onDeleteShape: (id: string) => void;
  onMoveShape: (id: string, cx: number, cy: number) => void;
  onResizeShape: (id: string, size: number) => void;
  mouseModeEnabled: boolean;
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
  selectedShapeId,
  onSelectShape,
  onDeleteShape,
  onMoveShape,
  onResizeShape,
  mouseModeEnabled,
}: Props) {
  const rafRef = useRef<number | null>(null);

  const stateRef = useRef({
    fsmState,
    strokeInProgress,
    currentPoint,
    completedShapes,
    morphAnimations,
    selectedShapeId,
  });

  // Keep stateRef in sync — must be in useLayoutEffect to satisfy React Compiler rules
  useLayoutEffect(() => {
    stateRef.current = {
      fsmState,
      strokeInProgress,
      currentPoint,
      completedShapes,
      morphAnimations,
      selectedShapeId,
    };
  });

  const dragRef = useRef<{
    shapeId: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    startCx: number;
    startCy: number;
    startSize: number;
  } | null>(null);

  // RAF render loop — local function avoids circular useCallback reference
  useEffect(() => {
    let rafId: number;
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId = requestAnimationFrame(draw); return; }

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

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    rafRef.current = rafId;

    return () => {
      cancelAnimationFrame(rafId);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef]);

  // Pointer event handlers for selection and shape manipulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function toCanvasPoint(e: PointerEvent): { x: number; y: number } {
      return { x: e.clientX, y: e.clientY };
    }

    function onDown(e: PointerEvent) {
      if (!mouseModeEnabled) {
        const pt = toCanvasPoint(e);
        const hit = hitTestAllShapes(pt, stateRef.current.completedShapes);
        if (hit) {
          onSelectShape(hit.shapeId);
          if (hit.hit === 'delete-handle') {
            onDeleteShape(hit.shapeId);
            return;
          }
          const shape = stateRef.current.completedShapes.find((s) => s.id === hit.shapeId);
          if (shape && hit.hit === 'body') {
            dragRef.current = {
              shapeId: hit.shapeId,
              mode: 'move',
              startX: e.clientX,
              startY: e.clientY,
              startCx: shape.cx,
              startCy: shape.cy,
              startSize: shape.size,
            };
            canvasRef.current!.setPointerCapture(e.pointerId);
          } else if (shape && hit.hit === 'resize-handle') {
            dragRef.current = {
              shapeId: hit.shapeId,
              mode: 'resize',
              startX: e.clientX,
              startY: e.clientY,
              startCx: shape.cx,
              startCy: shape.cy,
              startSize: shape.size,
            };
            canvasRef.current!.setPointerCapture(e.pointerId);
          }
        } else {
          onSelectShape(null);
        }
      }
    }

    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (drag.mode === 'move') {
        onMoveShape(drag.shapeId, drag.startCx + dx, drag.startCy + dy);
      } else {
        const delta = Math.sqrt(dx * dx + dy * dy) * (dx + dy > 0 ? 1 : -1);
        onResizeShape(drag.shapeId, Math.max(40, drag.startSize + delta * 0.5));
      }
    }

    function onUp() {
      dragRef.current = null;
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [canvasRef, onSelectShape, onDeleteShape, onMoveShape, onResizeShape, mouseModeEnabled]);

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
          cursor: mouseModeEnabled ? 'crosshair' : 'none',
          pointerEvents: 'auto',
        }}
      />
    </>
  );
}
