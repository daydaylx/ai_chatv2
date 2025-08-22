// Einmalige Cache-Bereinigung & Selbst-Deinstallation.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        // sich selbst deregistrieren
        await self.registration.unregister();
        // Optionale Info an Clients – bewusst ohne forced reload
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: 'SW_KILLED' });
        }
      } catch (e) {
        // noop
      }
    })()
  );
});

// Keine Fetch-Handler => kein Netz-Intercept.
