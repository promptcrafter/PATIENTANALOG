// Patient Analog Service Worker v1.0
// Enables offline browsing and PWA functionality

const CACHE_NAME = 'patientanalog-v3';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/portfolio.html',
  '/portfolio-assets.html',
  '/about.html',
  '/contact.html',
  '/platform.html',
  '/science.html',
  '/news.html',
  '/technology.html',
  '/companies.html',
  '/regulatory.html',
  '/market.html',
  '/glossary.html',
  '/legal/',
  '/haptic.html',
  '/assets/inline-extracted.css',
  '/assets/main-qZqwn-yL.js',
  '/favicon.svg',
  '/offline.html'
];

// Install event - precache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching critical resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          event.waitUntil(updateCache(event.request));
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Network failed - show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (error) {
    // Network unavailable - silently fail
  }
}

// Listen for messages from main thread
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
