import React, { type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "ghost" | "default";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/** Design-System Button – schlank, a11y-fähig, ohne TODOs. */
export function Button({ className, variant = "default", ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 h-10 text-sm font-medium " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
    "focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "bg-transparent border border-border text-foreground hover:bg-muted/10",
    default: "bg-secondary text-foreground hover:bg-secondary/80"
  };

  return <button className={cn(base, styles[variant], className)} {...rest} />;
}
