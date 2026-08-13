const CACHE_NAME = 'memory-house-v1';
// Derived from the worker's own script location so this also works when the
// app is served from a subpath (e.g. GitHub Pages' /<repo>/ basePath).
const BASE = new URL('./', self.location).pathname;
const APP_SHELL = [BASE, `${BASE}manifest.json`, `${BASE}icon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Static build assets: stale-while-revalidate. Everything else (pages, API,
// Supabase calls): network-first so data is never served stale, falling
// back to cache only when fully offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(`${BASE}_next/static/`)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match(BASE)))
  );
});
