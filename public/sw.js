const CACHE_NAME = 'moodloop-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Some assets may not exist; ignore.
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GETs.
  if (request.method !== 'GET') return;

  // Only handle same-origin requests. Cross-origin (e.g. the FastAPI
  // backend on :8000) is left to the browser — intercepting it risks
  // corrupting CORS preflights and masking real errors as ERR_FAILED.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Same-origin /api/* (none today, but be defensive): network-first,
  // fall back to cache. Always resolve respondWith to a real Response.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Static assets: cache-first, network fallback, never resolve to undefined.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          if (request.destination === 'document') {
            const offline = await caches.match('/offline.html');
            if (offline) return offline;
            const root = await caches.match('/');
            if (root) return root;
          }
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});
