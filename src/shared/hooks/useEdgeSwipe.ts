import { useEffect, useRef } from "react";

type Options = {
  onTrigger: () => void;
  edge?: "left" | "right";
  hotZone?: number;
  threshold?: number;
};

export function useEdgeSwipe(
  onTriggerOrOptions: Options | (() => void),
  extra?: Omit<Options, "onTrigger">
) {
  const opts: Required<Options> = (() => {
    if (typeof onTriggerOrOptions === "function") {
      return {
        onTrigger: () => { onTriggerOrOptions(); },
        edge: extra?.edge ?? "left",
        hotZone: extra?.hotZone ?? 24,
        threshold: extra?.threshold ?? 60,
      };
    }
    return {
      onTrigger: onTriggerOrOptions.onTrigger,
      edge: onTriggerOrOptions.edge ?? "left",
      hotZone: onTriggerOrOptions.hotZone ?? 24,
      threshold: onTriggerOrOptions.threshold ?? 60,
    };
  })();

  const active = useRef(false);
  const handled = useRef(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const t = e.touches.length > 0 ? e.touches[0] : undefined;
      if (!t) return;

      const x = t.clientX;
      const y = t.clientY;

      const isLeft = opts.edge === "left" && x <= opts.hotZone;
      const isRight = opts.edge === "right" && x >= window.innerWidth - opts.hotZone;
      if (!isLeft && !isRight) return;

      active.current = true;
      handled.current = false;
      startX.current = x;
      startY.current = y;
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || handled.current) return;

      const t = e.touches.length > 0 ? e.touches[0] : undefined;
      if (!t) return;
      if (startX.current == null || startY.current == null) return;

      const dx = t.clientX - startX.current;
      const dy = Math.abs(t.clientY - startY.current);
      if (dy > 24) return;

      const ok =
        (opts.edge === "left" && dx > opts.threshold) ||
        (opts.edge === "right" && -dx > opts.threshold);

      if (ok) {
        handled.current = true;
        opts.onTrigger();
      }
    }

    function onTouchEnd() {
      active.current = false;
      handled.current = false;
      startX.current = null;
      startY.current = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [opts.edge, opts.hotZone, opts.threshold, opts.onTrigger]);
}
