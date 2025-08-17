const CACHE_NAME = "ai-chatv2-shell-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isConfig(url) {
  return url.pathname === "/persona.json" ||
         url.pathname.startsWith("/config/") ||
         url.pathname === "/models.json" ||
         url.pathname === "/styles.json";
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nur GET cachen
  if (event.request.method !== "GET") return;

  // Konfigs: Stale-While-Revalidate
  if (isConfig(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res && res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // App-Shell: Cache-first
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(res => res || fetch(event.request))
    );
    return;
  }

  // Default: Netz
  // (optional: weitere Caching-Strategien hier)
});
