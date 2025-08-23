import * as React from "react";
import Button from "../shared/ui/Button";
import { cn } from "../shared/lib/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onSend();
    }
  };
  return (
    <div className="sticky bottom-0 inset-x-0 p-3 bg-[hsl(var(--surface-2))]/95 backdrop-blur border-t border-white/12">
      <div className="mx-auto max-w-screen-sm">
        <div className="flex items-end gap-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKey}
            placeholder="Nachricht eingeben…"
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl px-3 py-2",
              "bg-white/[0.06] border border-white/12",
              "text-white placeholder:text-white/60 caret-[hsl(var(--accent-600))]",
              "outline-none focus:ring-2 focus:ring-[hsl(var(--accent-600))]"
            )}
          />
          <Button size="md" onClick={onSend} disabled={disabled || !value.trim()}>
            Senden
          </Button>
        </div>
      </div>
    </div>
  );
}
