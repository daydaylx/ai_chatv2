// PWA Service Worker – App-Shell cache-first, JSON network-first
// Version bump => Clients bekommen frische Assets & Logik
const APP_SHELL = "app-shell-v2";
const RUNTIME   = "runtime-v1";

const SHELL_ASSETS = [
  "/", "/index.html", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== APP_SHELL && k !== RUNTIME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nur Same-Origin kontrollieren
  if (url.origin !== location.origin) return;

  // Navigationsanfragen -> App-Shell (network-first mit Fallback)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(APP_SHELL);
        cache.put("/", fresh.clone()).catch(()=>{});
        return fresh;
      } catch {
        return (await caches.match(req)) || (await caches.match("/index.html"));
      }
    })());
    return;
  }

  // JSON (persona/models/styles) -> network-first, dann Cache-Fallback
  if (url.pathname.endsWith(".json")) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      try {
        const fresh = await fetch(new Request(req, { cache: "no-store" }));
        cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Notfall: leere Antwort mit 503
        return new Response("{}", { status: 503, headers: { "Content-Type": "application/json" } });
      }
    })());
    return;
  }

  // Statische Assets -> cache-first
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/")  ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp")
  ) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      const cache = await caches.open(APP_SHELL);
      cache.put(req, res.clone()).catch(()=>{});
      return res;
    })());
  }
});
