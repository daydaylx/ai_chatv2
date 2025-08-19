import React from "react";
import { cn } from "../shared/lib/cn";

export function MessageBubble({ role, children }: { role: "user" | "assistant" | "system"; children: React.ReactNode }) {
  const isUser = role === "user";
  const isAsst = role === "assistant";

  return (
    <div
      className={cn(
        "max-w-[92%] w-fit px-3.5 py-2.5 rounded-2xl border",
        // Grundflächen: Surface-1, aber Assistant leicht getönt in Accent
        isAsst
          ? "bg-[hsl(var(--accent-200)/0.10)] border-[hsl(var(--accent-400)/0.20)]"
          : "bg-surface-1 border-1",
        // Ausrichtung
        isUser ? "ml-auto rounded-br-md" : "mr-auto rounded-bl-md",
        // Textfarbkontrast
        "text-1"
      )}
    >
      <div className="whitespace-pre-wrap leading-relaxed">{children}</div>
    </div>
  );
}
