import React from "react";
import { createPortal } from "react-dom";

type ToastKind = "info" | "error" | "success";
type Toast = { id: string; text: string; kind: ToastKind; until: number };

type Ctx = {
  show: (text: string, kind?: ToastKind, ms?: number) => void;
};

export const ToastContext = React.createContext<Ctx>({ show: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = React.useState<Toast[]>([]);
  const rootRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("id", "toast-root");
    document.body.appendChild(el);
    rootRef.current = el;
    return () => { el.remove(); };
  }, []);

  // GC
  React.useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setList(prev => prev.filter(x => x.until > now));
    }, 250);
    return () => clearInterval(t);
  }, []);

  const show = React.useCallback((text: string, kind: ToastKind = "info", ms = 2500) => {
    const t: Toast = { id: crypto.randomUUID?.() ?? String(Math.random()), text, kind, until: Date.now() + ms };
    setList(prev => [...prev, t]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {rootRef.current ? createPortal(
        <div className="fixed left-1/2 bottom-[calc(16px+env(safe-area-inset-bottom))] -translate-x-1/2 z-[70] flex flex-col gap-2 pointer-events-none">
          {list.map(t => (
            <div
              key={t.id}
              className={
                "pointer-events-auto rounded-2xl px-3 py-2 text-sm shadow-lg border " +
                (t.kind === "error"
                  ? "bg-[hsl(var(--accent-800)/0.85)] border-red-400/40 text-red-200"
                  : t.kind === "success"
                  ? "bg-[hsl(var(--accent-800)/0.85)] border-green-400/40 text-green-200"
                  : "bg-[hsl(var(--accent-800)/0.85)] border-white/15 text-white/90")
              }
            >
              {t.text}
            </div>
          ))}
        </div>
      , rootRef.current) : null}
    </ToastContext.Provider>
  );
}
