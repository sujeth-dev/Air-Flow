# AirDraw

Draw shapes in mid-air using your webcam and hand-tracking. Strokes snap to clean preset shapes automatically using the $1 Unistroke Recognizer. No backend — fully client-side.

![CI](https://github.com/sujeth-dev/air-flow/actions/workflows/ci.yml/badge.svg?branch=claude%2Fempty-repo-setup-gdVvc)

---

## Requirements

- Webcam (built-in or USB)
- Good lighting (face a window or lamp)
- HTTPS or localhost (required for `getUserMedia`)
- Modern browser: Chrome 120+, Edge 120+, or Firefox 121+

---

## How to Run

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Gesture System

AirDraw uses a palm-toggle + finger-curl gesture model:

| Gesture | Action |
|---------|--------|
| **Open palm** (hold 10 frames) | Toggle cursor on / off |
| **Point with index finger** | Aim cursor |
| **Curl index finger down** | Start drawing |
| **Uncurl index finger** | Finish stroke — shape snaps |

### Super Powers (Visual Effects)

Each recognized shape triggers a unique combat-style canvas animation:

| Shape | Effect |
|-------|--------|
| Circle | 🔥 Fireball — burst + perpetual embers |
| Line | ⚡ Lightning Slash — jagged bolt with branches |
| Triangle | 🛡 Force Shield — electric-blue ripple field |
| Square | 🔲 Energy Cube — holographic inner grid |
| Arrow | 🏹 Energy Arrow — exhaust trail + impact glow |
| Star | 🌟 Power Star — spinning beams + orbiting sparkles |

**Gesture-triggered powers:**

| Gesture | Power |
|---------|-------|
| All 5 fingers curled (fist) | 👊 Iron Fist — shockwave ring + IMPACT text |
| Peace sign (✌) | ⚡⚡ Double Lightning strike |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected shape |
| `Escape` | Deselect shape |
| `M` | Toggle mouse / touch drawing mode |
| `P` | Toggle presenter mode (fullscreen, HUD hidden) |
| `R` | Toggle recording |
| `Ctrl+S` | Screenshot (PNG download) |
| `Ctrl+Shift+X` | Clear all shapes (with confirmation) |

---

## Shape Manipulation

Click any shape to select it. Selection shows a dashed highlight with two handles:

- **× handle** (top-right) — delete the shape
- **◎ handle** (bottom-right) — drag to resize
- **Drag body** — move the shape anywhere

All manipulations are undo-able with `Ctrl+Z`.

---

## Mouse / Touch Mode

Press `M` (or the **Mouse** button in the HUD) to enable mouse/touch drawing — no camera required. Click and drag to draw a stroke, release to snap to a shape.

---

## Supported Shapes

Circle · Square · Triangle · Line · Arrow · Star

---

## Model Loading

The first visit downloads an 8 MB hand-tracking model from Google. A progress bar is shown during download. The model is cached in IndexedDB — subsequent visits are instant.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Framework: **Vite**  Output directory: `dist`  No env vars needed
4. Deploy — auto-deploys on every push

---

## Architecture

```
Webcam
  └── MediaPipe HandLandmarker (VIDEO mode, 1 hand)
        └── handGestures.ts  →  isPalmOpen / isIndexExtended / isIndexCurled
              └── GestureFSM  (INACTIVE → ACTIVE → CURSOR → DRAWING → RECOGNIZING)
                    └── strokeUtils.ts  →  resample / rotateBy / scaleToSquare
                          └── dollarRecognizer.ts  →  recognize(stroke)
                                └── ShapeRenderer.ts  →  renderFrame(canvas)
                                      └── powerEffects.ts  →  particle animations
```

| File | Role |
|------|------|
| `src/lib/oneEuroFilter.ts` | Adaptive scalar smoothing for jitter |
| `src/lib/strokeUtils.ts` | Geometry primitives (resample, centroid, rotate) |
| `src/lib/dollarRecognizer.ts` | $1 Unistroke Recognizer |
| `src/lib/gestureFSM.ts` | Gesture state machine |
| `src/lib/handGestures.ts` | MediaPipe landmark → gesture booleans |
| `src/lib/particleSystem.ts` | General-purpose particle emitter |
| `src/lib/powerEffects.ts` | Per-shape combat visual effects |
| `src/data/templates.ts` | Programmatic shape templates |
| `src/data/presets.ts` | Canvas draw functions per shape |
| `src/hooks/useHandTracking.ts` | Camera + MediaPipe RAF loop |
| `src/hooks/useModelCache.ts` | IndexedDB model caching |
| `src/hooks/useUndoRedo.ts` | Generic undo/redo stack |
| `src/hooks/useMouseFallback.ts` | Pointer-event drawing fallback |
| `src/hooks/useRecorder.ts` | Canvas → WebM recording |
| `src/components/CanvasStage.tsx` | Video + canvas with pointer events |
| `src/components/ShapeRenderer.ts` | Pure canvas renderer |
| `src/components/SelectionLayer.ts` | Hit-test + selection handles |
| `src/components/LoadingOverlay.tsx` | Model download progress UI |

---

## Privacy

All processing is local — no data leaves your browser. The hand-tracking model is loaded from Google CDN on first visit and cached locally.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Camera permission denied | Click the camera icon in address bar → Allow → reload |
| No camera detected | Check USB connection; try a different browser |
| Poor recognition accuracy | Draw slower and more deliberately; ensure good lighting |
| Low FPS | Close other browser tabs; use Chrome for best GPU performance |
| Model download slow | Wait for the progress bar; subsequent visits use the cache |
| Shape not snapping | Score must be ≥ 80%; the toast shows the closest match |

---

## Stage 2 (Coming Next)

Stage 2 will add 3D canvas, multi-user collaboration, and ML-powered shape completion.
