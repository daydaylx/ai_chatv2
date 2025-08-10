import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
};

export default function InputBar({ disabled, onSend, onAbort, isStreaming }: Props) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Mobile-Keyboard Handling
    const vv = (window as any).visualViewport;
    const el = document.documentElement;
    function onResize() {
      if (!vv) return;
      const bottom = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
      el.style.setProperty("--kb-safe", bottom + "px");
    }
    vv?.addEventListener?.("resize", onResize);
    onResize();
    return () => vv?.removeEventListener?.("resize", onResize);
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      trySend();
    }
  }

  function trySend() {
    const val = text.trim();
    if (!val) return;
    if (val.length > 5000 && !confirm("Eingabe > 5000 Zeichen. Wirklich senden?")) return;
    onSend(val);
    setText("");
    taRef.current?.focus();
  }

  return (
    <div className="inputbar">
      <textarea
        ref={taRef}
        className="inputbar__textarea"
        placeholder="Nachricht…  (Ctrl/⌘+Enter senden)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        rows={1}
        disabled={disabled || isStreaming}
      />
      {!isStreaming ? (
        <button className="inputbar__btn" disabled={disabled || !text.trim()} onClick={trySend} aria-label="Senden">
          ➤
        </button>
      ) : (
        <button className="inputbar__btn abort" onClick={onAbort} aria-label="Abbrechen">
          ✕
        </button>
      )}
    </div>
  );
}
