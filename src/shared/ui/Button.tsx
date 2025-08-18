import React from "react";
import { cn } from "../../shared/lib/cn";

type Variant = "solid" | "ghost" | "outline" | "primary"; // "primary" = Alias zu "solid"
type Size = "sm" | "md" | "lg" | "icon";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ className, variant="solid", size="md", ...rest }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 disabled:pointer-events-none";
  const sizes: Record<Size,string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-[15px]",
    lg: "h-12 px-5 text-base",
    icon: "h-11 w-11",
  };
  const effective = variant === "primary" ? "solid" : variant;
  const variants: Record<Exclude<Variant,"primary">,string> = {
    solid: "text-white bg-[hsl(var(--accent-600))] hover:bg-[hsl(var(--accent-500))]",
    ghost: "bg-transparent hover:bg-white/5 border border-transparent",
    outline: "bg-transparent border border-white/15 hover:border-white/30",
  };
  return <button className={cn(base, sizes[size], variants[effective as "solid"|"ghost"|"outline"], className)} {...rest} />;
}

export default Button;
