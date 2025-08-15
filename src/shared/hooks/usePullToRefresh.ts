import { useEffect, useRef, useState, type RefObject } from "react";

type Options = {
  distance?: number;
  maxPull?: number;
};

/**
 * Benutzung:
 * const { offset, active } = usePullToRefresh(listRef, async () => {...}, { distance: 80, maxPull: 120 })
 */
export function usePullToRefresh(
  elRef: RefObject<HTMLElement>,
  onRefresh: () => void | Promise<void>,
  { distance = 80, maxPull = 120 }: Options = {}
) {
  const startY = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    function onStart(e: TouchEvent) {
      const node = elRef.current;
      if (!node) return;
      if (node.scrollTop !== 0) return;

      const t0 = e.touches.item(0);
      if (!t0) return;

      startY.current = t0.clientY;
      setActive(true);
      setOffset(0);
    }

    function onMove(e: TouchEvent) {
      if (!active || startY.current == null) return;

      const t0 = e.touches.item(0);
      if (!t0) return;

      const dy = t0.clientY - startY.current;
      if (dy <= 0) {
        // Reset wenn nach oben gewischt
        setActive(false);
        startY.current = null;
        setOffset(0);
        return;
      }
      setOffset(Math.min(dy, maxPull));
    }

    async function onEnd() {
      if (!active) return;
      const shouldRefresh = offset >= distance;

      // Reset
      setActive(false);
      startY.current = null;
      setOffset(0);

      if (shouldRefresh) {
        await onRefresh();
      }
    }

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [elRef, onRefresh, active, offset, distance, maxPull]);

  return { offset, active };
}
