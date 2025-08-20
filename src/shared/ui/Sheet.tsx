import * as React from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export default function Sheet({ open, onOpenChange, title, className, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className={["absolute right-0 top-0 h-full w-full sm:w-[680px] bg-[hsl(var(--surface-2))] border-l border-white/12 p-4 overflow-auto", className].join(" ")}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title ?? "Einstellungen"}</h2>
          <button onClick={() => onOpenChange(false)} className="h-9 px-3 rounded-md hover:bg-white/10">Schließen</button>
        </div>
        {children}
      </div>
    </div>
  );
}
