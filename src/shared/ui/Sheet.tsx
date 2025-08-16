import { ReactNode, useEffect } from "react";
import { cn } from "../lib/cn";
import { motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Sheet({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn("fixed inset-0 z-[300]", open ? "pointer-events-auto" : "pointer-events-none")}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Einstellungen"}
        initial={{ x: "8%", opacity: 0 }}
        animate={{ x: open ? 0 : "8%", opacity: open ? 1 : 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className={cn(
          "absolute right-0 top-0 h-full w-[min(480px,92vw)]",
          "bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl",
          "grid grid-rows-[auto_1fr_auto]"
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <h2 className="text-lg font-bold">{title ?? "Einstellungen"}</h2>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border" aria-label="Schließen" onClick={onClose}>✕</button>
        </header>
        <div className="overflow-auto p-4 space-y-4">{children}</div>
        {footer ? <footer className="border-t border-[var(--border)] p-4 flex justify-end">{footer}</footer> : null}
      </motion.aside>
    </div>
  );
}
