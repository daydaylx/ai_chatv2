export function mountKeyboardSafeArea() {
  try {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    const root = document.documentElement;
    const update = () => {
      if (!vv) return;
      const dh = window.innerHeight - vv.height; // "verdrängte" Höhe
      root.style.setProperty("--kb-safe", Math.max(0, Math.round(dh)) + "px");
    };
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
      update();
      return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
        root.style.removeProperty("--kb-safe");
      };
    }
  } catch { /* no-op */ }
  return () => {};
}
