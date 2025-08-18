import React from "react";
import { cn } from "../shared/lib/cn";

export function MessageBubble({ role, children }: { role: "user"|"assistant"|"system"; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={cn("max-w-[92%] rounded-2xl px-3 py-2 border backdrop-blur", mine ? "bg-accent/15 border-accent/30 ml-auto" : "bg-white/5 border-white/10 mr-auto")}>
      <div className="whitespace-pre-wrap leading-relaxed">{children}</div>
    </div>
  );
}
