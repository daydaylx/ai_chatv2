/**
 * Kill-Switch Service Worker
 * - löscht alle Caches
 * - unregistert sich selbst
 * - reloadet alle Clients
 * Hinweis: wird einmal registriert, danach ist kein SW mehr aktiv.
 */
self.addEventListener('install', (event) => {
  // sofort aktiv werden
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // Alle Caches löschen
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}

    try {
      // Sich selbst deregistrieren
      await self.registration.unregister();
    } catch (_) {}

    try {
      // Alle Clients neu laden
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
    } catch (_) {}

    // Kontrolle übernehmen (für navigate)
    try { await self.clients.claim(); } catch (_) {}
  })());
});

// Kein fetch-Handler -> keinerlei Caching/Proxying
