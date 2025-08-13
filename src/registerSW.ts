/**
 * Client-seitiger Kill-Path:
 * - Unregister aller vorhandenen Service Worker (failsafe)
 * - Caches löschen
 * - Kill-Switch-SW (/sw.js) einmal registrieren, damit auch alte Registrations überschrieben werden
 * - Einmalig neu laden, damit Seite garantiert ohne SW läuft
 */
const FLAG = 'sw-killed-once';

async function killAllSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch (_) {
    // ignore
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (_) {
    // ignore
  }

  // Registriere den Kill-Switch-SW unter der alten URL, damit alte Instanzen sicher überschrieben werden
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (_) {
    // ignore
  }

  // Einmaliger Reload, falls vorher ein Controller aktiv war
  try {
    if (hadController && !sessionStorage.getItem(FLAG)) {
      sessionStorage.setItem(FLAG, '1');
      location.reload();
    }
  } catch (_) {
    // ignore
  }
}

// Sofort ausführen
killAllSW().catch(() => {});
