import * as React from "react";
import { cn } from "../lib/cn";

/** Variants:
 *  - "primary" ist Alias für "solid" (Kompatibilität für alte Tests)
 */
type Variant = "primary" | "solid" | "outline" | "ghost";
type Size = "icon" | "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

function classes(variant: Variant, size: Size) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";

  const sz =
    size === "icon"
      ? "h-9 w-9 text-base"
      : size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
      ? "h-12 px-5 text-base"
      : "h-11 px-4 text-[15px]";

  // normalize "primary" -> "solid"
  const vkey = variant === "primary" ? "solid" : variant;

  const v =
    vkey === "outline"
      ? "bg-transparent border border-white/20 hover:bg-white/[0.06] text-white"
      : vkey === "ghost"
      ? "bg-transparent hover:bg-white/[0.06] text-white"
      : "bg-[hsl(var(--accent-600))] text-black hover:brightness-95";

  return cn(base, sz, v);
}

function Button({ className, variant = "solid", size = "md", ...rest }: Props) {
  return <button className={cn(classes(variant, size), className)} {...rest} />;
}

export default Button;
export { Button }; // Named Export für Tests/alte Importe
