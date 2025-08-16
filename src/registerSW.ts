export function registerSW(path = "/sw.js") {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(path).catch(() => {/* still usable without SW */});
    });
  }
}
