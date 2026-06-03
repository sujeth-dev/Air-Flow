# AirDraw — Complete Review & Build Roadmap

> **Scope:** Stage 1 (Audit + Gesture Overhaul + Extra Features) → Stage 2 (Full-Stack 3D + ML)  
> **Status:** Planning & Review Document  
> **Date:** 2026-06-03

---

## 1. Executive Summary

**Air-Flow** by sujeth-dev is a client-side gesture-drawing app that uses MediaPipe hand tracking + the $1 Unistroke Recognizer to let users draw shapes in the air. The current implementation is technically sound but functions as a **tech demo** rather than a production product.

This document consolidates:
- A complete audit of the current Stage 1 codebase
- A new gesture control plan (palm activation, single-finger drawing)
- Extra manipulation features (move, resize, delete, recolor, reshape, super powers)
- The Stage 2 master plan (3D, CNN, backend, auth)

**Golden Rule:** Stage 1 must be shipped and stable before Stage 2 begins. Never build 3D + backend on top of a broken gesture pipeline.

---

## 2. Stage 1 — Current Audit

### 2.1 Architecture Score: 8/10

```
Webcam → MediaPipe HandLandmarker → One-Euro Filter → Gesture FSM → $1 Recognizer → Canvas render
```

| Layer | Assessment |
|-------|-----------|
| MediaPipe HandLandmarker | Industry-standard, 21 landmarks, ~30 FPS |
| One-Euro Filter | Smart choice for jitter smoothing without lag |
| Gesture FSM | Clean: IDLE → ARMED → DRAWING → RECOGNIZING |
| $1 Recognizer | Classic, perfect for geometric presets |
| Canvas rendering | Custom renderer, potential complexity |

### 2.2 Security & Privacy Score: 9/10

| Check | Status | Details |
|-------|--------|---------|
| HTTPS | Pass | Vercel default |
| Camera data leaves device? | **Pass — NO** | 100% client-side |
| External requests | Caution | MediaPipe WASM + 8MB model from Google CDN |
| No API keys | Pass | No env vars needed |
| CSP Headers | Unknown | Verify in `index.html` |

### 2.3 Code Quality Score: 6/10

| Module | Risk Level | Concern |
|--------|-----------|---------|
| `useHandTracking.ts` | **Critical** | Main loop runs inference every frame; throttle or WebWorker needed |
| `gestureFSM.ts` | Medium | Race conditions on rapid state changes |
| `dollarRecognizer.ts` | Medium | Sensitive to stroke order and direction |
| `strokeUtils.ts` | Medium | Math-heavy; needs unit tests |
| `useRecorder.ts` | Low | `.webm` may not play on Safari |

### 2.4 Accessibility Score: 2/10

| Criterion | Status |
|-----------|--------|
| Keyboard navigation | Fail |
| Screen reader support | Fail |
| Camera-not-available fallback | Fail — hard block |
| Motion sensitivity | Fail — no `prefers-reduced-motion` |
| Color contrast | Unknown |

### 2.5 Performance Score: 5/10

| Factor | Assessment |
|--------|-----------|
| Bundle size | Caution — 8MB model download |
| Runtime | Caution — MediaPipe + canvas is GPU/CPU intensive |
| Memory | Caution — leaks possible on unmount |
| First Paint | Pass |
| Time to Interactive | Fail — blocked by model + permission |

### 2.6 UX/UI Score: 6/10

| Feature | Status |
|---------|--------|
| Pinch-to-draw | Pass |
| Shape snapping | Pass |
| Presenter mode | Pass |
| Video recording | Pass |
| Onboarding | Fail — no interactive tutorial |
| Undo/Redo | Unknown — not mentioned |
| Shape customization | Fail — fixed presets only |

### 2.7 DevOps & Testing Score: 3/10

| Aspect | Status |
|--------|--------|
| Test suite | Fail — none visible |
| CI/CD | Fail — no GitHub Actions |
| Linting | Fail — no ESLint/Prettier |
| Node 22+ | Caution — very recent requirement |

---

## 3. Stage 1 — New Gesture Control Plan

### 3.1 Why Change?

| Current Problem | New Plan Fix |
|---------------|-------------|
| Cursor always on, distracting | Palm toggle = intentional activation |
| Pinch requires two fingers, harder to control | Single finger = more precise |
| No way to "pause" without hiding hand | Palm gesture = clear on/off switch |
| Accidental pinches start drawing | Closed finger = deliberate draw action |

### 3.2 New State Machine

```
HIDDEN / IDLE
      │
      ▼
  OPEN PALM shown
      │
      ▼
   ACTIVE MODE  ◄────── OPEN PALM shown again ──►  IDLE
      │                                              │
      │                                              │
      ▼                                              │
  INDEX FINGER detected                              │
      │                                              │
      ▼                                              │
   CURSOR visible                                    │
      │                                              │
      ▼                                              │
  FINGER CLOSED (draw) ──► FINGER OPEN ──► shape snaps
      │                                              │
      └──────────────────────────────────────────────┘
```

### 3.3 Gesture Definitions

| Stage | User Action | System Response |
|-------|-------------|-----------------|
| **Activate** | Show **open palm** | App enters active mode; cursor appears |
| **Deactivate** | Show **open palm** again | App exits active mode; cursor disappears |
| **Cursor** | Extend **index finger** | Cursor follows fingertip |
| **Draw** | **Close finger** (curl/fist) | Starts stroke; trail records |
| **Snap** | **Open finger** | Ends stroke; $1 recognizer classifies; morphs to preset |

### 3.4 Visual Feedback Plan

| Stage | What User Sees |
|-------|---------------|
| Palm shown | Subtle "locked in" indicator (border glow, icon) |
| Active mode | Cursor dot appears at index fingertip |
| Finger moving | Trail follows cursor |
| Finger closed | Stroke being recorded (trail thickens/acid glow) |
| Finger opened | Stroke completes; morph animation to clean shape |
| Palm shown again | Indicator fades; cursor gone; app idle |

### 3.5 MediaPipe Landmarks to Track

- **Palm detection:** All 21 landmarks spread = open palm
- **Finger cursor:** Landmark 8 (index tip)
- **Finger close:** Landmark 8 distance to palm center (landmark 0) below threshold

---

## 4. Stage 1 — Extra Manipulation Features

### 4.1 Feature List

| Feature | Interaction | Notes |
|---------|------------|-------|
| **Move** | Drag shape with finger (or mouse fallback) | Translate canvas coordinates |
| **Resize** | Two-finger spread in air OR corner handles on select | Scale transform |
| **Delete** | Palm swipe across shape OR "X" button on select | Remove from scene array |
| **Recolor** | Gesture cycle (e.g., fist = next color) OR palette UI | Update preset color token |
| **Reshape** | Re-draw over existing shape to replace OR morph menu | Re-run $1 recognizer on new stroke |

### 4.2 "Super Powers" — Gesture Shortcuts

| Gesture | Action | When |
|---------|--------|------|
| **Two-finger swipe left** | Undo last shape | Any active state |
| **Two-finger swipe right** | Redo | Any active state |
| **Fist hold (2 sec)** | Clear all shapes | Any active state |
| **Peace sign (index + middle)** | Screenshot / save frame | Any active state |
| **Thumbs up** | Presenter mode toggle | Any active state |
| **Shaka (thumb + pinky)** | Record start/stop | Any active state |

---

## 5. Stage 1 — Priority Fixes (From Audit)

### 5.1 Critical (Do First)

1. **Implement new gesture FSM** — Palm toggle + single finger + finger close
2. **Fix memory leaks** — Proper cleanup of MediaPipe, camera streams, animation frames on unmount
3. **Add unit tests** — `strokeUtils.ts`, `dollarRecognizer.ts`, `gestureFSM.ts`

### 5.2 Important (Do Before Ship)

4. **Add loading progress UI** — For 8MB model download
5. **Implement `prefers-reduced-motion`** — Disable morph animations for sensitive users
6. **Add undo/redo** — Essential for drawing app
7. **Cache model in IndexedDB** — Avoid re-downloading every visit
8. **Add keyboard/mouse fallback** — Canvas must work without camera

### 5.3 Nice-to-Have

9. **Interactive onboarding overlay** — First-run tutorial
10. **Custom shape training** — Let users teach new gestures
11. **Multi-stroke support** — Complex shapes from multiple strokes
12. **ESLint + Prettier + pre-commit hooks**
13. **GitHub Actions CI** for build verification

---

## 6. Stage 2 — Full-Stack Master Plan

> **Prerequisite:** Stage 1 must be shipped, stable, and deployed.  
> **Timeline:** 4–6 weeks  
> **Goal:** Sketch → 3D model, manipulate, save to account.

### 6.1 Architecture

```
Webcam → MediaPipe → $1 Recognizer → Rasterize → TF.js CNN → Map → Three.js → Gesture Transform → API → Postgres
```

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js (App Router) | Frontend + API in one deploy |
| 3D | Three.js + react-three-fiber + drei | Declarative 3D in React |
| ML | TensorFlow.js (inference) · Keras (train) | Train offline, run quantized in-browser |
| Backend | Next.js route handlers | Thin server over DB |
| DB + Auth | Supabase (Postgres + Auth + Storage) | Managed, RLS, GLB hosting |
| Hosting | Vercel + Supabase | Free-tier friendly |

### 6.2 Database Schema (Supabase)

```sql
profiles        id uuid PK→auth.users, display_name, created_at
scenes          id uuid PK, user_id FK, name, created_at, updated_at
scene_objects   id, scene_id FK, object_type text,
                position jsonb {x,y,z}, rotation jsonb, scale float
custom_mappings id, user_id FK, shape_class text, object_type text

-- RLS on every table: visible/writable only where user_id = auth.uid()
```

### 6.3 API Endpoints

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/scenes` | List my scenes |
| POST | `/api/scenes` | Create scene |
| GET | `/api/scenes/:id` | Get scene + objects |
| PUT | `/api/scenes/:id` | Save objects |
| DELETE | `/api/scenes/:id` | Delete scene |
| GET/POST | `/api/mappings` | Custom shape→object mappings |

### 6.4 ML Plan (CNN)

| Step | Detail |
|------|--------|
| Data | Google QuickDraw `.npy` bitmaps, ~12 classes, few thousand samples each |
| Preprocess | 28×28 grayscale, normalized 0–1 |
| Model | Small CNN: [Conv→Conv→Pool]×2 → Dense → softmax |
| Train | Keras in Colab; target ≥92% accuracy |
| Export | `tensorflowjs_converter` for quantized TF.js |
| Inference | Rasterize stroke to 28×28 canvas → `tf.browser.fromPixels` → predict |
| Hybrid Logic | If $1 score high & geometric → use $1 (fast); else → CNN |

### 6.5 Gesture → 3D Transform

| Input | Action |
|-------|--------|
| One pinch + drag | Rotate (Δx,Δy → euler.y, euler.x) |
| Two hands | Scale (Δdistance) + Translate (Δmidpoint) |
| Damping | Lerp every frame (0.15 factor) |
| Fallback | Mouse-orbit when no hands detected |

### 6.6 Stage 2 Milestones

| ID | Milestone | Done Criterion |
|----|-----------|---------------|
| M0 | Scaffold | Next.js + port `lib/` + Supabase schema + RLS. App runs, DB reachable, Stage 1 recognizer still works. |
| M1 | 3D Viewport | r3f scene, `useGLTF` presets, map recognizer → spawn object. Drawing a circle spawns the cell model. |
| M2 | Manipulate | `gestureTransform.ts`, damping, mouse fallback. Rotate & scale feel smooth, no jitter. |
| M3 | ML | Train, convert, integrate CNN + $1 fallback. CNN demonstrably beats $1 on messy input (logged numbers). |
| M4 | Persist | Supabase Auth, API routes, RLS, SavePanel. Log in, save scene, reload → it restores. |
| M5 | Polish | Object library UX, loading/empty states, model caching, a11y. First interaction <3s on cold load. |
| M6 | Ship | Round-trip + RLS-security + ML eval tests. Deploy Vercel+Supabase. Live full-stack link. |

### 6.7 Stage 2 Definition of Done

- ≥12 object classes
- CNN demonstrably beats $1 baseline on messy sketches (measurable)
- Gestures manipulate 3D objects fluidly
- Accounts + scene save/load work end-to-end
- RLS security verified (User A cannot read User B's scenes)
- Deployed as live full-stack app

---

## 7. Stage 3 — Multiplayer (Summary Only)

> **Prerequisite:** Stage 2 stable and live.  
> **Timeline:** 4–6 weeks.

- Shared rooms with CRDT/WebSocket sync
- Presence indicators
- Live remote teaching & sales-demo wedge
- **Do not start until Stage 2 is shipped.**

---

## 8. Streaming & Broadcasting Roadmap

| Phase | Stage | Method | What to Build |
|-------|-------|--------|--------------|
| 1 | Stage 1 | Tab-share | Presenter mode toggle (fullscreen, hide chrome) |
| 2 | Stage 2 | In-app record | `canvas.captureStream()` → `MediaRecorder` → `.webm` download |
| 3 | Stage 3 | OBS overlay | Green-screen toggle (`--bg` → `#00FF00`); user configures OBS |

---

## 9. Implementation Order (Final Sequence)

```
PHASE 1A: Stage 1 Core Fixes
├── Implement new gesture plan (palm toggle, single finger, finger close)
├── Fix memory leaks + performance throttling
├── Add loading progress for 8MB model
└── Deploy and verify ≥25 FPS

PHASE 1B: Stage 1 Extra Features
├── Move, resize, delete, recolor, reshape
├── Super powers (undo, redo, clear, screenshot, record)
├── Onboarding overlay
├── Undo/redo system
├── Keyboard/mouse fallback
└── Final Stage 1 ship

PHASE 2: Stage 2 (Master Plan)
├── M0: Next.js + Supabase scaffold
├── M1: 3D viewport + GLB presets
├── M2: Gesture transforms (rotate/scale)
├── M3: CNN training + hybrid routing
├── M4: Auth + save/load + RLS
├── M5: Polish + performance budget
└── M6: Ship full-stack

PHASE 3: Stage 3 (Future)
└── Multiplayer shared rooms
```

---

## 10. Top Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Hand tracking jittery in bad light | One-Euro filter + on-screen lighting guidance; set FPS floor in DoD |
| Gesture fires accidentally | Hysteresis thresholds + minimum stroke length; visible pen-down state |
| Stage 2 ML scope balloons | $1 fallback means app works before CNN; ML is upgrade, not blocker |
| 3D + gestures feel floaty | Damping/lerp, sensible limits, mouse-orbit fallback |
| Cold-load latency (model + GLBs) | Quantize <2MB, lazy-load, CDN cache; DoD <3s to first interaction |
| Building Stage 2 on broken Stage 1 | **Hard rule:** Stage 1 must be shipped and stable first |

---

## 11. Final Scores Recap

| Category | Stage 1 Current | Stage 1 Target (After Fixes) | Stage 2 Target |
|----------|----------------|---------------------------|--------------|
| Architecture | 8/10 | 9/10 | 9/10 |
| Security & Privacy | 9/10 | 9/10 | 9/10 |
| Code Quality | 6/10 | 8/10 | 8/10 |
| Accessibility | 2/10 | 6/10 | 7/10 |
| Performance | 5/10 | 7/10 | 7/10 |
| UX/UI | 6/10 | 8/10 | 9/10 |
| DevOps & Testing | 3/10 | 7/10 | 8/10 |
| **Overall** | **5.9/10** | **8.3/10** | **8.3/10** |

---

*Document compiled from audit, gesture plan, feature requests, and uploaded master plan. Execute in order. Do not skip Phase 1.*
