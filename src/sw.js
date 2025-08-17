import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Precache alle Build-Assets
precacheAndRoute(self.__WB_MANIFEST);

// Cleanup alter Caches
cleanupOutdatedCaches();

// Cache Strategy für Persona-Daten
registerRoute(
  ({ url }) => url.pathname.endsWith('/persona.json'),
  new StaleWhileRevalidate({
    cacheName: 'persona-data',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?v=${Date.now()}`;
      }
    }]
  })
);

// Cache Strategy für API-Requests
registerRoute(
  ({ url }) => url.origin === 'https://openrouter.ai',
  new StaleWhileRevalidate({
    cacheName: 'openrouter-api',
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        return response.status === 200 ? response : null;
      }
    }]
  })
);

// Cache Strategy für statische Assets
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({
    cacheName: 'static-assets',
  })
);

// Skip waiting und Clients claimen
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
