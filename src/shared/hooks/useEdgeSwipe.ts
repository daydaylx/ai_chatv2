import { useEffect } from "react";

/** Links-Edge-Swipe (20px) → onOpen() */
export function useEdgeSwipe(onOpen: () => void) {
  useEffect(() => {
    let startX = 0, startY = 0, swiping = false;
    const EDGE = 20;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      swiping = startX <= EDGE;
    }
    function onTouchMove(e: TouchEvent) {
      if (!swiping) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 50 && dy < 40) { onOpen(); swiping = false; }
    }
    function onTouchEnd() { swiping = false; }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onOpen]);
}
