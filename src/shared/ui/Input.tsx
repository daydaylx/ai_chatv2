import React from "react";
import { cn } from "../../shared/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn("w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-accent/70", className)}
      {...rest}
    />
  )
);
Input.displayName = "Input";
