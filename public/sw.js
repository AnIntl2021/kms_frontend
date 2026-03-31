// FNF ERP Service Worker (App Engine)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Basic Offline Fallback to satisfy Chrome PWA
      return new Response("Offline - fresh'n'fastkw ERP");
    })
  );
});
