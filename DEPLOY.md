# Air-Flow — Deployment

Two production targets are wired in parallel. Vite emits a static `dist/` and both edges serve it. SPA fallback, security headers, asset caching, and the service worker are configured for both.

## Vercel

**Console route**

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Vercel auto-detects Vite — leave the build command (`npm run build`) and output dir (`dist`) defaults.
3. `vercel.json` (committed at repo root) handles SPA rewrites + headers — no manual config needed.
4. Deploy.

**CLI route**

```sh
npm i -g vercel
vercel link        # pick the project
vercel --prod      # ships dist/
```

**CI route**

The `Deploy` workflow in `.github/workflows/deploy.yml` triggers on `main`. Add these to the repo:

- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`
- Variable: `VERCEL_PROJECT_ID`

The Vercel job is skipped until `VERCEL_PROJECT_ID` is set, so the workflow stays green before the project exists.

## Cloudflare Pages

**Dashboard route**

1. Cloudflare Dashboard → Pages → Create → Connect to Git → pick this repo.
2. Build command: `npm run build`. Output dir: `dist`. Node 22.
3. `public/_redirects` and `public/_headers` are copied to the deployment root by Vite, so SPA fallback + security headers + cache policy ship together.
4. Deploy.

**CLI route**

```sh
npm i -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=air-flow
```

`wrangler.toml` at the repo root tells `wrangler` where to find the output.

**CI route**

Same workflow. Add:

- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Variable: `CLOUDFLARE_PROJECT_NAME` (e.g. `air-flow`)

Both Vercel and Cloudflare jobs run in parallel after a single shared build artifact. Either can be skipped just by leaving its project-id variable empty.

## What gets configured by each file

| File | Vercel | Cloudflare Pages | Purpose |
|---|---|---|---|
| `vercel.json` | ✓ | — | Framework, SPA rewrite, headers, cache rules |
| `wrangler.toml` | — | ✓ | Tells wrangler where dist/ lives |
| `public/_redirects` | — | ✓ | SPA fallback (`/* /index.html 200`) |
| `public/_headers` | — | ✓ | Security headers + cache policy |
| `public/manifest.webmanifest` | ✓ | ✓ | PWA install metadata |
| `public/sw.js` | ✓ | ✓ | Offline shell + asset cache |
| `public/icon-{192,512}.svg` | ✓ | ✓ | PWA icons |

## Camera permission

Both edges send `Permissions-Policy: camera=(self)` so the MediaPipe HandLandmarker can request the webcam. The page must be served over HTTPS — both platforms do this by default on their assigned domains and on custom domains with their managed certificates.

## Cache strategy

- `dist/assets/*` (hashed JS/CSS) → `public, max-age=31536000, immutable` (forever)
- `/sw.js` → `no-cache, no-store, must-revalidate` (always fresh so updates roll out)
- MediaPipe WASM + model → cached by the service worker on first load (cache-first)
- HTML shell → cached by the service worker for offline navigation

## Verifying after deploy

```sh
# Vercel
curl -I https://<your-vercel-domain>/sw.js
# expect: cache-control: no-cache, no-store, must-revalidate

# Cloudflare
curl -I https://<your-pages-domain>/assets/index-XXXX.js
# expect: cache-control: public, max-age=31536000, immutable
```

Then open the deployed URL on a desktop browser, allow camera access, and confirm the FPS counter reads ≥ 24 in the studio HUD.
