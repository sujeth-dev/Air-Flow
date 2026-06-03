# AirDraw — Stage 1 Build Spec (Claude Code execution brief)

> **How to use this file:** open an empty folder, start Claude Code, and paste:
> *"Read airdraw-stage1-BUILD.md and build the entire Stage 1 app end to end. Do not stop until every item in the Acceptance Checklist passes and `npm run build` succeeds."*
> This spec is scoped so the whole stage can be completed in one run.

---

## 0. Ground rules for the agent

- **Language:** TypeScript, `strict: true`. No `any` unless unavoidable.
- **No placeholders.** Every file must be fully implemented and runnable. No `// TODO`, no stubbed functions.
- **It must actually run.** After building, run `npm run dev` reasoning and `npm run build`; fix all type/build errors before declaring done.
- **Self-contain Stage 1.** Do **not** add 3D, ML, backend, auth, databases, or multiplayer — those are later stages. Build exactly what's below.
- **Keep `lib/` framework-agnostic** (pure TS, no React imports) so later stages reuse it intact.
- If a library API differs from what's described here (versions move), adapt to the installed version and keep the behavior identical.

---

## 1. What we're building

A client-side web app. The user allows their webcam, **pinches thumb+index to "put the pen down," draws a shape in the air, and releases**; the rough stroke is recognized and snaps into a clean preset shape on a canvas. Ships with a presenter mode and optional in-app recording for screen-sharing into Zoom/Meet.

**Data flow:**
`Webcam → MediaPipe HandLandmarker → One-Euro filter → Gesture FSM → stroke buffer → $1 Unistroke recognizer → canvas morph render`

---

## 2. Stack & setup

```bash
npm create vite@latest airdraw -- --template react-ts
cd airdraw
npm i @mediapipe/tasks-vision
npm run dev
```

No other runtime deps required. No env vars, no secrets. Styling is plain CSS via a tokens file (no Tailwind needed).

**Hosting target:** Vercel/Netlify static (`npm run build` → `dist/`). HTTPS is required for camera; both provide it.

---

## 3. File manifest (build all of these)

```
airdraw/
├─ index.html
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                 # wires hook → state → UI
│  ├─ styles/tokens.css       # design tokens + global styles
│  ├─ hooks/
│  │  └─ useHandTracking.ts   # camera + MediaPipe loop
│  ├─ lib/                    # PURE TS, reused by later stages
│  │  ├─ oneEuroFilter.ts
│  │  ├─ gestureFSM.ts
│  │  ├─ strokeUtils.ts
│  │  └─ dollarRecognizer.ts
│  ├─ data/
│  │  ├─ templates.ts         # canonical templates for the 6 shapes
│  │  └─ presets.ts           # clean-shape render definitions
│  └─ components/
│     ├─ CanvasStage.tsx      # video underlay + trail + result layers
│     ├─ ShapeRenderer.ts     # draws trail + morph-to-clean on canvas
│     ├─ Hud.tsx              # FPS, tracking status, FSM state, record btn
│     ├─ HistoryRail.tsx
│     └─ PresenterToggle.tsx
```

---

## 4. Module specs (implement exactly)

### 4.1 `lib/oneEuroFilter.ts`
Implement the **One-Euro filter** for a scalar; export a small class usable per-axis (filter x and y separately).
- Constructor params: `minCutoff` (default `1.0`), `beta` (default `0.015`), `dCutoff` (default `1.0`).
- Method `filter(value: number, timestampMs: number): number`.
- Standard low-pass + adaptive cutoff based on derivative. Reset cleanly on first sample.

### 4.2 `lib/strokeUtils.ts`
Pure geometry helpers operating on `Point = {x:number,y:number}`:
- `resample(points, n=64)` — even spacing by path length.
- `indicativeAngle(points)` — angle from centroid to first point.
- `rotateBy(points, angle)` — rotate about centroid.
- `scaleToSquare(points, size=250)` — scale bounding box to `size`.
- `translateToOrigin(points)` — move centroid to (0,0).
- `pathLength`, `centroid` helpers.

### 4.3 `lib/dollarRecognizer.ts`
Classic **$1 Unistroke Recognizer**:
- `Template = { name: string, points: Point[] }` (templates pre-processed at load: resample→rotate to 0→scale→translate).
- `recognize(points: Point[]): { name: string, score: number }` — preprocess the input the same way, golden-section-search rotation, average point distance, `score = 1 - dist / (0.5 * Math.sqrt(2) * size)`.
- Export an `addTemplate` and a default recognizer seeded from `data/templates.ts`.
- **Acceptance threshold lives in the caller:** accept if `score > 0.80`, else "not recognized."

### 4.4 `data/templates.ts`
**Generate canonical templates programmatically** (so no recorded data is needed) for these 6 classes, each as an ordered `Point[]` traced along the ideal shape:
`circle, square, triangle, line, arrow, star`.
e.g. circle = sample 64 points around a circle; square = points along the 4 edges; etc. Provide 1 template per shape (the recognizer's rotation-invariance handles orientation).

### 4.5 `data/presets.ts`
For each class, a clean draw function `(ctx, center, size) => void` rendering the pristine shape with the design tokens (acid stroke, rounded joins, glow via shadowBlur).

### 4.6 `lib/gestureFSM.ts`
Pure state machine. States: `IDLE | ARMED | DRAWING | RECOGNIZING`.
- Input each frame: `{ handPresent: boolean, pinchDistance: number, point: Point, t: number }`.
- **Pinch hysteresis:** `T_on` and `T_off` with `T_on < T_off` (start defaults: normalized distances `T_on=0.045`, `T_off=0.07`; tunable consts at top of file). This prevents flicker.
- Transitions: no hand → `IDLE`; hand present → `ARMED`; pinch below `T_on` → `DRAWING` (begin buffering points); while DRAWING append points; pinch above `T_off` → `RECOGNIZING` (emit completed stroke); then back to `ARMED`.
- **Reject strokes with < 8 points.**
- Expose `update(input)` returning `{ state, strokeInProgress, completedStroke|null }`. No React, no DOM.

### 4.7 `hooks/useHandTracking.ts`
- Request webcam via `getUserMedia({ video: true })`, attach to a hidden `<video>`, `await video.play()`.
- Init MediaPipe: `FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm")`, then `HandLandmarker.createFromOptions(..., { baseOptions:{ modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" }, runningMode:"VIDEO", numHands:1 })`.
- Loop with `requestAnimationFrame`; call `detectForVideo(video, performance.now())`.
- From landmarks: **index tip = landmark 8**, **thumb tip = landmark 4** (normalized 0–1). Compute `pinchDistance = euclidean(lm4, lm8)`. Smooth index-tip x/y with two `OneEuroFilter` instances.
- **Mirror horizontally** (`x → 1 - x`) so it feels like a mirror.
- Track and expose **FPS** (rolling average) and `trackingStatus`.
- Return per-frame `{ point, pinchDistance, handPresent, fps, trackingStatus }` via a callback or state.
- Clean up camera + landmarker on unmount.

### 4.8 `components/CanvasStage.tsx` + `ShapeRenderer.ts`
- Full-viewport `<canvas>`; mirrored, dimmed `<video>` behind it (low opacity, `filter: brightness`).
- Each frame: clear, draw fading **trail** of the in-progress stroke (acid, glow), draw the fingertip **cursor** (color by FSM state: ARMED muted, DRAWING acid-glow, RECOGNIZING pulse).
- On a completed + accepted result: run a short **morph animation** from raw stroke → preset shape (interpolate/scale fade ~400ms), then leave the clean shape on a results layer and push to history.
- On "not recognized": show closest guess + hint toast; do not dead-end.

### 4.9 `components/Hud.tsx`
Bottom-left HUD: FPS, tracking status, current FSM state (with the same color coding). Include the **Record** button (see §6) and the **Presenter** toggle entry point.

### 4.10 `components/HistoryRail.tsx`
Right-side rail listing recognized shapes (name + score + tiny glyph). Hidden in presenter mode.

### 4.11 `components/PresenterToggle.tsx`
Toggle that (a) calls the Fullscreen API on the app root, (b) adds a `.presenter` class that hides HUD + history + any chrome, leaving only the canvas, and (c) applies compression-safe styling (thicker strokes, max contrast — see tokens).

### 4.12 `App.tsx`
Wire `useHandTracking` → `gestureFSM` (instantiated once) → `dollarRecognizer` (on completed stroke) → `ShapeRenderer`. Hold app state: `{ trackingStatus, fps, fsmState, lastResult, history[] }`. Handle camera-permission-denied and no-hand states with friendly overlays.

---

## 5. Design system (`styles/tokens.css`)

Dark "instrument panel" aesthetic; the glowing shape is the hero.

```css
:root{
  --bg:#0c0d10; --panel:#131519; --line:#262a31;
  --ink:#e9ece8; --muted:#8b9199;
  --acid:#c8f24e; --cyan:#5fd4d6; --warn:#f2a93b;
  --stroke-w:5px; --radius:14px;
}
.presenter{ --bg:#000000; --stroke-w:9px; } /* compression-safe: thicker, max contrast */
```
- Fonts (Google Fonts): display **Bricolage Grotesque**, body **Hanken Grotesk**, mono **JetBrains Mono**.
- Honor `@media (prefers-reduced-motion: reduce)` — disable the morph/pulse animations.
- AA contrast; status conveyed by text + color, never color alone.

---

## 6. Streaming Phase 1–2 (in scope for Stage 1)

**Phase 1 — Presenter mode (tab-share):** implemented by `PresenterToggle` above. No streaming code; the user just screen-shares the tab in Zoom/Meet.

**Phase 2 — In-app recording:**
- Add a `useRecorder` hook: `const stream = canvasEl.captureStream(30)`, feed to `new MediaRecorder(stream, { mimeType })`.
- **Codec:** prefer `video/webm;codecs=vp9`; fall back to `video/webm;codecs=vp8` then `video/webm`. Do **not** assume mp4 works (it isn't reliably supported by MediaRecorder across browsers). Output `airdraw-session.webm`.
- Buffer `dataavailable` chunks in memory; on stop, `Blob` → object URL → auto-create a download link.
- Record button lives in the HUD; show a recording indicator while active.

---

## 7. Acceptance checklist (all must pass = stage done)

- [ ] `npm run build` completes with no TS errors.
- [ ] On load, app requests camera; denied-permission and no-hand states show friendly overlays.
- [ ] A fingertip cursor tracks the index finger; FPS HUD shows **≥ 25 FPS** on a normal laptop.
- [ ] Cursor is visibly smoothed (no raw jitter) and the cursor color reflects the FSM state.
- [ ] Pinch starts a stroke; release ends it; no flicker (hysteresis works); strokes < 8 points are ignored.
- [ ] All **6 shapes** (circle, square, triangle, line, arrow, star) are recognized and snap to clean presets; "not recognized" shows a closest-guess hint instead of failing silently.
- [ ] History rail logs recognized shapes with scores.
- [ ] Presenter toggle goes fullscreen, hides HUD + rail, thickens strokes, leaves canvas only.
- [ ] Record button produces a downloadable `.webm` of the canvas.
- [ ] `prefers-reduced-motion` disables animations.
- [ ] A short README documents: webcam + good-lighting requirement, how to run, how to deploy to Vercel.

---

## 8. Deploy

```bash
npm run build      # → dist/
# Vercel: framework preset "Vite", output dir dist/, no env vars.
```

---

## 9. OUT OF SCOPE for this run — manual prerequisites for later stages

Do **not** attempt these now; they require human setup the agent can't do autonomously. Listed so you know what's next:

- **Stage 2 (3D + ML + persistence):** requires you to (1) create a Supabase project and provide URL + keys, (2) train the CNN in Colab on cleaned QuickDraw data and run `tensorflowjs_converter`, then hand the agent the model files. The agent can then build the Next.js migration, Three.js viewport (GLB ≤1.5 MB via Draco), gesture transforms, API routes, RLS, and save/load.
- **Stage 3 (multiplayer):** requires a deployed WebSocket/CRDT server.
- **Streaming Phase 3 (OBS overlay):** the app only adds a green-screen (`--bg:#00FF00`) toggle; OBS Studio + Virtual Camera is a desktop workflow you run yourself.

**For this run: build all of Stage 1 (§1–§8) completely, then stop.**
