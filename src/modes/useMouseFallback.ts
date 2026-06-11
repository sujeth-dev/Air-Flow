import { useEffect, useRef } from 'react';
import type { Point } from '../engine/stroke';

const MIN_POINTS = 8;

export function useMouseFallback(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onStroke: (points: Point[]) => void,
  enabled: boolean,
): void {
  const drawing = useRef(false);
  const buffer = useRef<Point[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function toNorm(e: PointerEvent): Point {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    }

    function onDown(e: PointerEvent) {
      if ((e.target as HTMLElement).closest('[data-selection-handle]')) return;
      drawing.current = true;
      buffer.current = [toNorm(e)];
      canvas!.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent) {
      if (!drawing.current) return;
      buffer.current.push(toNorm(e));
    }

    function onUp() {
      if (!drawing.current) return;
      drawing.current = false;
      if (buffer.current.length >= MIN_POINTS) {
        onStroke([...buffer.current]);
      }
      buffer.current = [];
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
  }, [canvasRef, onStroke, enabled]);
}
