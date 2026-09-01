/**
 * Aurora Music - Service Worker
 * Provides offline support and PWA functionality
 */

const CACHE_NAME = 'aurora-music-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/db.js',
  './js/audio.js',
  './js/metadata.js',
  './js/player.js',
  './js/library.js',
  './js/ui.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle same-origin requests
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            // Return cached version and update in background
            event.waitUntil(
              fetch(request)
                .then(response => {
                  if (response.ok) {
                    return caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(request, response);
                        return response;
                      });
                  }
                  return response;
                })
                .catch(() => cached)
            );
            return cached;
          }

          // Not in cache, fetch from network
          return fetch(request)
            .then(response => {
              if (response.ok) {
                const clone = response.clone();
                event.waitUntil(
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, clone))
                );
              }
              return response;
            })
            .catch(() => {
              // Return offline fallback for HTML pages
              if (request.headers.get('accept')?.includes('text/html')) {
                return caches.match('./index.html');
              }
              return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
