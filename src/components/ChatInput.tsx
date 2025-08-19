import React from "react";
import Button from "../shared/ui/Button";

export function ChatInput({ value, onChange, onSend, busy }:{
  value: string; onChange: (v: string)=>void; onSend: ()=>void; busy: boolean;
}) {
  const taRef = React.useRef<HTMLTextAreaElement|null>(null);

  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(180, el.scrollHeight) + "px";
  }, [value]);

  return (
    <div className="sticky bottom-0 inset-x-0 p-2 bg-[hsl(var(--surface-2)/0.5)] backdrop-blur-md border-t border-1">
      <div className="flex gap-2">
        <textarea
          ref={taRef}
          rows={1}
          className="flex-1 resize-none bg-white/8 border border-1 rounded-xl px-3 py-2 outline-none focus:border-[hsl(var(--accent-400))] placeholder:text-muted"
          placeholder="Nachricht schreiben… (Enter=Send, Shift+Enter=Zeile)"
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          onKeyDown={(e)=>{ if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); onSend(); } }}
          disabled={busy}
          enterKeyHint="send"
          aria-label="Nachricht"
        />
        <Button onClick={onSend} variant={busy ? "outline" : "solid"} aria-label={busy ? "Stop" : "Senden"}>
          {busy ? "Stop" : "Senden"}
        </Button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
