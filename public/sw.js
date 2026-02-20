/**
 * Logic Looper - Service Worker
 * Provides offline-first caching strategy
 */

const CACHE_NAME = 'logic-looper-v1';
const STATIC_ASSETS = [
    '/',
    '/achievements',
    '/leaderboard',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('SW: Failed to cache some assets:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // API routes: network-first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For Next.js _next/static assets: cache-first
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // For page navigations: network-first, fallback to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => {
                        return cached || caches.match('/');
                    });
                })
        );
        return;
    }

    // Default: network-first
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// Background sync for pending scores
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-scores') {
        event.waitUntil(syncPendingScores());
    }
});

async function syncPendingScores() {
    // This would read from IndexedDB and send to server
    // The actual sync logic is handled client-side in the app
    console.log('SW: Background sync triggered for scores');
}
