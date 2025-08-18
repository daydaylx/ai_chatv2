import React from "react";
import { cn } from "../../shared/lib/cn";

export function Badge({ children, className }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-white/15 px-2.5 py-1 text-xs opacity-90", className)}>{children}</span>;
}
