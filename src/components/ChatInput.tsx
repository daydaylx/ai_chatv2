import React, { useEffect, useRef, useState } from "react";

interface Props {
  disabled?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
}

export default function ChatInput({ disabled, onSend, placeholder = "Nachricht eingeben…" }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = next + "px";
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const doSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="input-bar">
      <textarea
        ref={ref}
        className="input-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        enterKeyHint="send"
        aria-label="Nachricht"
        disabled={!!disabled}
      />
      <button className="send-button" onClick={doSend} disabled={disabled || value.trim().length === 0} aria-label="Senden">
        <svg viewBox="0 0 24 24" className="icon">
          <path d="M3 11l18-8-8 18-2-7-8-3z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
}
