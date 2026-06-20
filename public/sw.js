// KMS ERP Service Worker (App Engine)
const CACHE_NAME = 'kms-erp-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/ANSOFTT_LOGO.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip Chrome extensions or other non-http schemes
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for basic assets
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Handle navigation fallback for SPA (render index.html shell so React Router works offline)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }

        // Try to match other requests in cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a plain text error if a non-navigation asset is completely missing offline
          return new Response("Offline resource unavailable", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

