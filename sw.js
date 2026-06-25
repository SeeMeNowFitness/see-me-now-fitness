// See Me Now Fitness — Blueprint Tracker Service Worker
const CACHE = 'smn-blueprint-v1';
const PRECACHE = [
  '/tracker.html',
  'https://fonts.googleapis.com/css2?family=Anton&display=swap'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for Firestore & API calls
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') ||
      url.includes('api.spoonacular.com') ||
      url.includes('api.nal.usda.gov')) {
    return; // let browser handle API calls normally
  }

  // Cache-first for fonts and static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
