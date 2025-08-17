/**
 * Registriert den Service Worker und meldet "Update verfügbar".
 * AppShell lauscht auf window-Event 'sw:update'.
 */
export function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      const notify = () => {
        if (reg.waiting) {
          window.dispatchEvent(new CustomEvent("sw:update", { detail: reg }));
        }
      };
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") notify();
        });
      });
      // Bereits waiting?
      notify();

      // Controllerwechsel => Seite neu laden (nach SKIP_WAITING)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }).catch(() => {});
  });
}

// Utility um den SW zu aktivieren
export function applySWUpdate(reg: ServiceWorkerRegistration) {
  reg.waiting?.postMessage?.("SKIP_WAITING");
}
