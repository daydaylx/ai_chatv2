import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

const handler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(handler, {
  allowlist: [/^\/$/, /\/index\.html/],
  denylist: [/^\/api\//]
}));

registerRoute(
  ({ request }) => ["style", "script", "image", "font"].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: "assets-v1",
    plugins: [new ExpirationPlugin({ maxEntries: 200, purgeOnQuotaError: true })]
  })
);

registerRoute(({ url }) => url.origin === "https://openrouter.ai", new NetworkOnly(), "GET");
registerRoute(({ url }) => url.origin === "https://openrouter.ai", new NetworkOnly(), "POST");
