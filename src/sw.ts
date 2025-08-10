/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst, NetworkOnly } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

// __WB_MANIFEST wird von Workbox ersetzt (injectManifest)
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// App-Shell für Navigationsanfragen (SPA)
const handler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(handler, {
  allowlist: [/^\/$/ , /^\/index\.html$/ , /^\/(?!api).*/]
}));

// Statische Assets (CSS/JS/Images) – schnell und offline
registerRoute(
  ({ request }) => ["style", "script", "image", "font"].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: "assets-v1",
    plugins: [new ExpirationPlugin({ maxEntries: 200, purgeOnQuotaError: true })]
  })
);

// OpenRouter API – niemals cachen
registerRoute(
  ({ url }) => url.origin === "https://openrouter.ai",
  new NetworkOnly(),
  "GET"
);
registerRoute(
  ({ url }) => url.origin === "https://openrouter.ai",
  new NetworkOnly(),
  "POST"
);
