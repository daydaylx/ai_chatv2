import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  isStreaming: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
};

const MAX_LEN = 16000;
const COOLDOWN_MS = 1200;

function vibe(ms: number) { try { (navigator as any).vibrate?.(ms); } catch {} }

export default function InputBar({ disabled, isStreaming, onSend, onAbort }: Props) {
  const [text, setText] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const now = Date.now();
  const cooling = now < cooldownUntil;

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    };
    el.addEventListener("keydown", onKey as any);
    return () => el.removeEventListener("keydown", onKey as any);
  }, [text, disabled, isStreaming, cooling]);

  function handleSend() {
    if (disabled || isStreaming || cooling) return;
    const t = text.trim();
    if (!t) return;
    if (t.length > MAX_LEN) { alert(`Zu lang (${t.length}). Max ${MAX_LEN}.`); return; }
    onSend(t);
    setText("");
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    vibe(12);
  }

  function handleAbort() {
    onAbort();
    vibe(24);
  }

  return (
    <div className="inputbar">
      <textarea
        ref={taRef}
        className="inputbar__textarea"
        placeholder={disabled ? "API-Key fehlt. Tippe oben auf „Key setzen“." : "Nachricht eingeben…"}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        disabled={!!disabled || isStreaming}
        rows={1}
      />
      <button
        className={`inputbar__btn ${isStreaming ? "abort" : ""}`}
        onClick={() => (isStreaming ? handleAbort() : handleSend())}
        disabled={!!disabled || (cooling && !isStreaming)}
        aria-label={isStreaming ? "Abbrechen" : "Senden"}
        title={cooling && !isStreaming ? "Kurz warten…" : ""}
      >
        {isStreaming ? "⛔" : "➤"}
      </button>
      <div style={{ alignSelf: "end", fontSize: 11, color: "var(--muted)", minWidth: 68, textAlign: "right", padding: "0 4px 6px 4px" }}>
        {text.length}/{MAX_LEN}
      </div>
    </div>
  );
}
