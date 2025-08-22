import * as React from "react";
import { cn } from "../lib/cn";

type Variant = "solid" | "outline" | "ghost" | "primary";
type Size = "sm" | "md" | "lg" | "icon";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

function ButtonBase({ variant = "solid", size = "md", className, ...rest }: Props) {
  const base = "inline-flex items-center justify-center rounded-md transition-colors select-none";
  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-base",
    icon: "h-9 w-9 text-base p-0"
  };
  // "primary" ist Alias auf "solid", damit alte Tests nicht brechen
  const v = variant === "primary" ? "solid" : variant;
  const variants: Record<Exclude<Variant, "primary">, string> = {
    solid: "bg-[hsl(var(--accent-600))] text-black hover:bg-[hsl(var(--accent-600))]/90",
    outline: "border border-white/15 text-white hover:bg-white/5",
    ghost: "text-white hover:bg-white/6"
  };
  return <button className={cn(base, sizes[size], variants[v], className)} {...rest} />;
}

// Default-Export und named Export für Test-Kompatibilität
export default ButtonBase;
export { ButtonBase as Button };
