// ── See Me Now Fitness — Service Worker ──
// Update this version number every time you upload a new tracker.html
// Clients will automatically get the fresh version within seconds
const CACHE_VERSION = 'smn-v24';
const CACHE_NAME = CACHE_VERSION;

const PRECACHE_URLS = [
  '/',
  '/see-me-now-fitness/tracker.html',
  '/see-me-now-fitness/manifest.json',
  '/see-me-now-fitness/logo.png'
];

// Install — cache core files
self.addEventListener('install', event => {
  // Force this service worker to activate immediately, don't wait
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

// Activate — delete ALL old caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
// This means clients ALWAYS get the latest version if online
self.addEventListener('fetch', event => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got a good response — update the cache and return it
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request);
      })
  );
});
