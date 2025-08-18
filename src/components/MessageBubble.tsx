import React from "react";
import { cn } from "../shared/lib/cn";
import { Sheet } from "../shared/ui/Sheet";
import { useToast } from "../shared/ui/Toast";

export function MessageBubble({ role, children }: { role: "user"|"assistant"|"system"; children: React.ReactNode }) {
  const mine = role === "user";
  const [openActions, setOpenActions] = React.useState(false);
  const holdTimer = React.useRef<number | null>(null);
  const toast = useToast();

  const text = String(children ?? "");

  function copy() {
    navigator.clipboard?.writeText(text).then(
      () => toast.show("Text kopiert", "success"),
      () => toast.show("Kopieren fehlgeschlagen", "error")
    );
  }
  async function share() {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ text });
      } else {
        await navigator.clipboard?.writeText(text);
        toast.show("Text in Zwischenablage (kein Share vorhanden)");
      }
    } catch {
      // abgebrochen oder Fehler
    }
  }

  const startHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    // 450ms Long-Press
    holdTimer.current = window.setTimeout(() => { setOpenActions(true); }, 450) as unknown as number;
  };
  const endHold = () => {
    if (holdTimer.current) { window.clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  return (
    <>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3 py-2 border backdrop-blur transition-colors",
          mine
            ? "bg-[hsl(var(--accent-400)/0.15)] border-[hsl(var(--accent-400)/0.35)] ml-auto"
            : "bg-[hsl(var(--accent-200)/0.07)] border-[hsl(var(--accent-400)/0.15)] mr-auto"
        )}
        onContextMenu={(e)=>{ e.preventDefault(); setOpenActions(true); }}
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerCancel={endHold}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{children}</div>
      </div>

      <Sheet open={openActions} onClose={()=>setOpenActions(false)} title="Aktionen" ariaLabel="Aktionen">
        <div className="grid gap-2">
          <button className="h-11 px-3 rounded-xl border border-white/15 text-left hover:bg-white/5" onClick={()=>{ copy(); setOpenActions(false); }}>Kopieren</button>
          <button className="h-11 px-3 rounded-xl border border-white/15 text-left hover:bg-white/5" onClick={()=>{ share(); setOpenActions(false); }}>Teilen</button>
          <button className="h-11 px-3 rounded-xl border border-white/15 text-left hover:bg-white/5" onClick={()=>setOpenActions(false)}>Abbrechen</button>
        </div>
      </Sheet>
    </>
  );
}
