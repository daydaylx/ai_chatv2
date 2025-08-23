import * as React from "react";
import { cn } from "../lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 px-3 rounded-md bg-white/[0.06] border border-white/12 text-sm outline-none",
        "focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-600))]",
        className
      )}
      {...props}
    />
  );
});
