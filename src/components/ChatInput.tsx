/**
 * Was & Warum:
 * Verhindert "weiß auf weiß": explizite Farben (Text/BG/Placeholder/Caret) + klarer Fokus-Ring.
 * Behält Prop-Namen `busy` bei (Kompatibilität zu ChatPanel), leitet auf disabled.
 */
import * as React from "react";

type Props = {
  value: string;
  busy?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
  onSend: () => void;
};

export function ChatInput({ value, busy, placeholder, onChange, onSend }: Props) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim().length) onSend();
    }
  };

  return (
    <div className="w-full bg-background border-t border-muted/40 p-2">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || "Nachricht schreiben…"}
          disabled={!!busy}
          rows={1}
          className={[
            "flex-1 resize-none rounded-xl px-3 py-3 min-h-[44px]",
            // Immer sichtbare Farben (Light & Dark):
            "text-foreground bg-card placeholder:text-muted-foreground caret-foreground",
            // Deutlicher Fokus-Ring:
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            // Längere Texte: begrenzt und scrollbar:
            "max-h-[40vh] overflow-auto",
            // Deaktiviert-Feedback:
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!!busy || !value.trim().length}
          className={[
            "min-w-[44px] min-h-[44px] px-3 rounded-xl",
            "bg-foreground text-background",
            "hover:opacity-90 active:opacity-80",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          ].join(" ")}
          title="Senden"
        >
          ►
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
