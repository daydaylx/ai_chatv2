import React from "react";
import Button from "../shared/ui/Button";

export function ChatInput({ value, onChange, onSend, busy }:{
  value: string; onChange: (v: string)=>void; onSend: ()=>void; busy: boolean;
}) {
  const taRef = React.useRef<HTMLTextAreaElement|null>(null);

  React.useEffect(() => {
    // Auto-grow
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(180, el.scrollHeight) + "px";
  }, [value]);

  return (
    <div className="sticky bottom-0 inset-x-0 p-2 bg-black/40 backdrop-blur-md border-t border-white/10">
      <div className="flex gap-2">
        <textarea
          ref={taRef}
          rows={1}
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-accent/70"
          placeholder="Nachricht schreiben… (Enter=Send, Shift+Enter=Zeile)"
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          onKeyDown={(e)=>{ if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); onSend(); } }}
          disabled={busy}
          enterKeyHint="send"
          aria-label="Nachricht"
        />
        <Button onClick={onSend} disabled={busy || !value.trim()} aria-label={busy ? "Warten" : "Senden"}>{busy ? "…" : "Senden"}</Button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
