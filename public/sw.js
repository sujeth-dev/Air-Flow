/* ============================================================
 * Air-Flow — service worker (v2)
 *
 * Strategy:
 *   - Pre-cache the shell so the app loads offline once visited.
 *   - Stale-while-revalidate for built JS/CSS chunks.
 *   - Cache-first for icons, fonts, and MediaPipe WASM/model assets
 *     (they're enormous and we want them hot for offline replay).
 *   - Network-only for everything else.
 * ========================================================== */

const CACHE_VERSION = 'airflow-v2-1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.svg',
  'icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => !n.startsWith(CACHE_VERSION))
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cache-first for big, stable assets: icons, fonts, MediaPipe WASM + model.
  const isHeavyAsset =
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'storage.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.task');

  if (isHeavyAsset) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }

  // SWR for built JS / CSS — fast load, background refresh.
  if (url.pathname.match(/\.(js|css|svg|webmanifest)$/)) {
    event.respondWith(staleWhileRevalidate(req, ASSET_CACHE));
    return;
  }

  // Navigation requests — fall back to shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html').then((r) => r || new Response('Offline', { status: 503 }))),
    );
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetched = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await fetched) || Response.error();
}
