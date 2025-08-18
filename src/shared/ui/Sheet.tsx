import React from "react";
import { cn } from "../../shared/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  ariaLabel?: string;
  describedById?: string;
};

export function Sheet({ open, onClose, children, title, ariaLabel, describedById }: Props) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus-Trap (strict TS + noUncheckedIndexedAccess sicher)
  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current!;
    const selectors = [
      "button","[href]","input","select","textarea","[tabindex]:not([tabindex='-1'])"
    ];
    const getFocusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(selectors.join(",")))
        .filter(el => !el.hasAttribute("disabled"));

    const firstFocus = () => { const nodes = getFocusable(); (nodes[0] ?? panel).focus(); };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = getFocusable();
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    };

    firstFocus();
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (title ? undefined : "Sheet")}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={describedById}
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#0B0B0B]/95 backdrop-blur-xl border-t border-white/10 max-h-[85dvh] overflow-auto",
          "shadow-[0_-12px_60px_rgba(0,0,0,0.5)] focus:outline-none"
        )}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          {title ? <div id={titleId} className="text-sm uppercase tracking-wide opacity-70">{title}</div> : <div />}
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="h-9 w-9 rounded-full border border-white/15 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-400))]"
          >✕</button>
        </div>
        <div className="p-4">{children}</div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
