import React from "react";
import { cn } from "../../shared/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-3 rounded-xl bg-white/7 border border-white/12 outline-none",
        "placeholder:opacity-60 focus:border-[hsl(var(--accent-400))]",
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = "Input";
