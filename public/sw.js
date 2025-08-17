// App-Shell Caching (Navigation-Fallback), statische Assets, kein API-Caching
const CACHE_NAME = "app-shell-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // API-Calls und Cross-Origin nicht cachen
  if (url.origin !== location.origin) return;

  // Navigation -> App-Shell Fallback
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  // Statische Assets / JSON
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(
      caches.match(req).then((cacheRes) => {
        return (
          cacheRes ||
          fetch(req).then((fetchRes) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, fetchRes.clone());
              return fetchRes;
            });
          })
        );
      })
    );
  }
});
