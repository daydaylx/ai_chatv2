// App-Shell: cache-first; JSON: network-first; Update-Flow mit SKIP_WAITING
const APP_SHELL = "app-shell-v5";
const RUNTIME   = "runtime-v1";

const SHELL_ASSETS = [ "/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png" ];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_SHELL).then(c => c.addAll(SHELL_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== APP_SHELL && k !== RUNTIME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request; const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(APP_SHELL); cache.put("/", fresh.clone()).catch(()=>{});
        return fresh;
      } catch { return (await caches.match(req)) || (await caches.match("/index.html")); }
    })()); return;
  }

  if (url.pathname.endsWith(".json")) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      try {
        const fresh = await fetch(new Request(req, { cache: "no-store" }));
        cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      } catch { return (await caches.match(req)) || new Response("{}", { status: 503, headers: { "Content-Type":"application/json" }}); }
    })()); return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/") || /\.(?:js|css|png|svg|webp)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(req); if (cached) return cached;
      const res = await fetch(req); const cache = await caches.open(APP_SHELL); cache.put(req, res.clone()).catch(()=>{});
      return res;
    })()); return;
  }
});

// Message-Handler für "SKIP_WAITING"
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
