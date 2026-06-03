import { useEffect, useRef, useState } from 'react';
import type { HandLandmarker as HandLandmarkerType } from '@mediapipe/tasks-vision';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { OneEuroFilter } from '../lib/oneEuroFilter';
import type { Point } from '../lib/strokeUtils';

export type TrackingStatus = 'loading' | 'searching' | 'tracking' | 'lost';

export interface TrackingOutput {
  point: Point;
  pinchDistance: number;
  handPresent: boolean;
  fps: number;
  trackingStatus: TrackingStatus;
}

const FPS_WINDOW = 30;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useHandTracking(
  onFrame: (data: TrackingOutput) => void
): { videoRef: React.RefObject<HTMLVideoElement>; error: string | null } {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const landmarkerRef = useRef<HandLandmarkerType | null>(null);
  const filterXRef = useRef(new OneEuroFilter(1.0, 0.015, 1.0));
  const filterYRef = useRef(new OneEuroFilter(1.0, 0.015, 1.0));
  const fpsTimestampsRef = useRef<number[]>([]);
  const lastHandTimeRef = useRef<number>(0);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });

        const video = videoRef.current;
        if (!video || cancelled) return;

        video.srcObject = stream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        filterXRef.current.reset();
        filterYRef.current.reset();

        function loop() {
          if (cancelled) return;
          const vid = videoRef.current;
          if (!vid || vid.readyState < 2) {
            rafIdRef.current = requestAnimationFrame(loop);
            return;
          }

          const now = performance.now();
          const result = landmarker.detectForVideo(vid, now);

          const timestamps = fpsTimestampsRef.current;
          timestamps.push(now);
          if (timestamps.length > FPS_WINDOW) timestamps.shift();
          const fps =
            timestamps.length >= 2
              ? ((timestamps.length - 1) * 1000) /
                (timestamps[timestamps.length - 1] - timestamps[0])
              : 0;

          const hasHand = result.landmarks.length > 0;

          if (hasHand) {
            lastHandTimeRef.current = now;
            const lm = result.landmarks[0];
            const thumb = lm[4];
            const index = lm[8];

            const rawX = 1 - index.x;
            const rawY = index.y;

            const sx = filterXRef.current.filter(rawX, now);
            const sy = filterYRef.current.filter(rawY, now);

            const mirroredThumbX = 1 - thumb.x;
            const pinchDistance = euclidean(
              { x: mirroredThumbX, y: thumb.y },
              { x: sx, y: sy }
            );

            onFrameRef.current({
              point: { x: sx, y: sy },
              pinchDistance,
              handPresent: true,
              fps,
              trackingStatus: 'tracking',
            });
          } else {
            const timeSinceLast = now - lastHandTimeRef.current;
            const status: TrackingStatus = timeSinceLast < 2000 ? 'lost' : 'searching';
            filterXRef.current.reset();
            filterYRef.current.reset();
            onFrameRef.current({
              point: { x: 0.5, y: 0.5 },
              pinchDistance: 1,
              handPresent: false,
              fps,
              trackingStatus: status,
            });
          }

          rafIdRef.current = requestAnimationFrame(loop);
        }

        rafIdRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'Camera access failed';
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
          setError('Camera access denied. Please allow camera access and reload the page.');
        } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('device')) {
          setError('No camera found. Please connect a webcam and reload.');
        } else {
          setError(`Camera error: ${msg}`);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return { videoRef, error };
}
