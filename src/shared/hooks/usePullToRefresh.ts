import { useEffect, useRef, useState } from "react";

export function usePullToRefresh(containerRef: React.RefObject<HTMLElement>, onRefresh: () => Promise<void> | void) {
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const [offset, setOffset] = useState(0);
  const THRESH = 70;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (el.scrollTop !== 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      setOffset(0);
    }
    function onTouchMove(e: TouchEvent) {
      if (!pulling.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        e.preventDefault();
        setOffset(Math.min(dy, 120));
      } else {
        setOffset(0);
      }
    }
    async function onTouchEnd() {
      if (offset > THRESH) await onRefresh();
      pulling.current = false; startY.current = null; setOffset(0);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [containerRef, offset, onRefresh]);

  return { offset, active: offset > 0 };
}
