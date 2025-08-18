import React from "react";
import { cn } from "../../shared/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  ariaLabel?: string;
};

export function Sheet({ open, onClose, children, title, ariaLabel }: Props) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title ?? "Sheet"}
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#111]/95 backdrop-blur-xl border-t border-white/10 max-h-[85dvh] overflow-auto",
          "shadow-[0_-12px_60px_rgba(0,0,0,0.5)]"
        )}
      >
        {title && <div className="px-5 pt-4 pb-2 text-sm uppercase tracking-wide opacity-70">{title}</div>}
        <div className="p-4">{children}</div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
