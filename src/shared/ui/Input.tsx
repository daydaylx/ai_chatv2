import * as React from "react";
import { cn } from "../lib/cn";

/** Licht/Dunkel lesbar, deutlicher Fokus, sichtbarer Placeholder/Caret */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-3 rounded-xl",
        "bg-white/[0.06] border border-white/12",
        "text-white placeholder:text-white/60 caret-[hsl(var(--accent-600))]",
        "outline-none focus:ring-2 focus:ring-[hsl(var(--accent-600))]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = "Input";
