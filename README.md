# AirDraw

Draw shapes in the air with your webcam. Pinch your thumb and index finger together to start a stroke, move your hand to draw, then release to snap the stroke into a clean preset shape.

## Requirements

- **Webcam** — a standard laptop webcam or external USB camera works fine
- **Good lighting** — face a window or lamp; avoid strong backlight. Low light degrades tracking accuracy.
- **Modern browser** — Chrome 90+, Edge 90+, or Firefox 90+ (Chrome recommended for best MediaPipe performance)
- **HTTPS** — required for camera access (handled automatically by Vercel/Netlify; `localhost` is also allowed)
- **Internet connection** on first load — downloads the hand tracking model (~8 MB from Google Storage) and WASM runtime from CDN

## Supported Shapes

| Shape | Draw |
|-------|------|
| Circle | A closed loop |
| Square | Four connected sides |
| Triangle | Three connected sides |
| Line | A straight stroke |
| Arrow | A line with an arrowhead at one end |
| Star | A five-pointed star |

## How to Use

1. Open the app and allow camera access when prompted
2. Hold your hand in front of the camera — a cursor dot will appear at your index fingertip
3. **Pinch** thumb + index finger together (cursor turns green/acid) to start drawing
4. Move your hand to trace the shape in the air
5. **Release** the pinch — the stroke is recognized and snaps to a clean preset shape
6. Shapes with score < 80% show a "closest match" hint instead of snapping

**Presenter mode:** Click "Present" (top-right) to go fullscreen with only the canvas visible — perfect for screen-sharing into Zoom or Meet.

**Record:** Click "Record" (bottom-left HUD) to capture a `.webm` video of the canvas. Click "Stop" to download it.

## Running Locally

```bash
node --version   # requires 22+
npm install
npm run dev      # open http://localhost:5173
```

## Building for Production

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

## Deploying to Vercel

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:** none required
4. Deploy — Vercel auto-deploys on every push to main

## Deploying to Netlify

1. Push this repo to GitHub
2. New site from Git in [Netlify](https://app.netlify.com)
3. Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Deploy

## Architecture

```
Webcam → MediaPipe HandLandmarker → One-Euro Filter → Gesture FSM → $1 Recognizer → Canvas render
```

| Module | Purpose |
|--------|---------|
| `lib/oneEuroFilter.ts` | Smooths jittery hand coordinates |
| `lib/strokeUtils.ts` | Geometry helpers (resample, rotate, scale, translate) |
| `lib/dollarRecognizer.ts` | $1 Unistroke Recognizer — classifies strokes |
| `lib/gestureFSM.ts` | State machine: IDLE → ARMED → DRAWING → RECOGNIZING |
| `data/templates.ts` | Canonical shape templates (generated programmatically) |
| `data/presets.ts` | Clean canvas draw functions per shape |
| `hooks/useHandTracking.ts` | Camera + MediaPipe + One-Euro filter loop |
| `hooks/useRecorder.ts` | Canvas stream recording to .webm |
| `components/CanvasStage.tsx` | Full-viewport canvas + video underlay |
| `components/ShapeRenderer.ts` | Pure canvas rendering: trail, cursor, morph animation |

## Privacy

All processing is 100% client-side. No video, images, or hand data ever leave your device. The only external requests are: the MediaPipe WASM runtime (CDN, read-only) and the hand tracking model (~8 MB, Google Storage).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Camera not working | Check browser permissions; try reloading |
| Low FPS / lag | Close other tabs; use Chrome; ensure GPU acceleration is on |
| Hand not detected | Improve lighting; keep hand within frame; try slower movements |
| Poor recognition | Draw shapes more deliberately; use whole-arm movement for larger strokes |
| Pinch firing accidentally | Adjust your hand posture; the T_on threshold is 0.045 (normalized distance) |
