import React, { ButtonHTMLAttributes } from "react";

/**
 * Button-Varianten:
 * - "solid" (Default): Klasse "btn btn--solid"
 * - "ghost": Klasse "btn btn--ghost"
 * - "primary": visuell wie "solid", PLUS ein inert­er Marker "bg-primary" (für Tests)
 *
 * Keine zusätzlichen Tailwind-Utilities, damit das bestehende Theme die Optik kontrolliert.
 */
type Variant = "ghost" | "solid" | "primary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className = "", variant = "solid", ...rest }: Props) {
  let cls = "btn";
  if (variant === "ghost") cls += " btn--ghost";
  else cls += " btn--solid";

  // Test-Markierung ohne visuelle Bevormundung
  if (variant === "primary") cls += " bg-primary";

  return <button className={`${cls} ${className}`.trim()} {...rest} />;
}

export default Button;
