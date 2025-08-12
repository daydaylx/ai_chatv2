/* Service Worker – Workbox (injectManifest)

Konservatives Asset-Caching, keine API-Caches. Nur für private Nutzung.
/
/ eslint-disable no-undef */
// Workbox Runtime-Imports (werden bei Build aufgelöst)
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

self.skipWaiting();
clientsClaim();

// Assets aus dem Build precachen (Manifest wird von Vite/Workbox injiziert)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA-Navigation: alles außer /api und /assets-Binaries geht auf index.html
const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(
new NavigationRoute(navigationHandler, {
denylist: [
//api//,
//assets/.*.(?:json|txt|xml)$/,
],
})
);

// Statische Assets (JS/CSS/Worker/Font/Img) – StaleWhileRevalidate + Expiration
registerRoute(
({ request }) => ['script','style','worker','font','image'].includes(request.destination),
new StaleWhileRevalidate({
cacheName: 'assets-swr',
plugins: [
new ExpirationPlugin({
maxEntries: 200,
maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Tage
purgeOnQuotaError: true,
}),
],
})
);

// OpenRouter & andere externe APIs: NIE cachen → NetworkOnly
registerRoute(
({ url }) => url.hostname.endsWith('openrouter.ai'),
new NetworkOnly({ cacheName: 'api-network-only' })
);

// Optional: eigene Health-Checks
self.addEventListener('message', (event) => {
if (event.data === 'SKIP_WAITING') {
self.skipWaiting();
}
});
