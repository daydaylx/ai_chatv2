export function registerSW(url: string) {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(url).catch(() => {});
    });
  }
}
