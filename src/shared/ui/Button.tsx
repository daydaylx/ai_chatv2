import React, { ButtonHTMLAttributes } from "react";

/**
 * Minimaler Button mit Varianten.
 * Erwartung der Tests:
 * - variant="primary" muss eine Klasse "bg-primary" enthalten.
 * - "ghost" bleibt transparent, "solid" ist die Standardvariante.
 *
 * Design-Hinweis:
 * - Wir liefern semantische Klassen "btn", "btn--*" und zusätzlich Tailwind-kompatible Utility-Klassen.
 * - Die Tests prüfen nur auf "bg-primary", daher wird diese Klasse bei "primary" immer gesetzt.
 */
type Variant = "ghost" | "solid" | "primary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

function classesForVariant(variant: Variant): string {
  switch (variant) {
    case "ghost":
      // transparente Variante
      return [
        "btn",
        "btn--ghost",
        "bg-transparent",
        "text-white/80",
        "hover:bg-white/5",
        "focus-visible:ring-2",
        "focus-visible:ring-white/30",
      ].join(" ");
    case "primary":
      // Tests erwarten "bg-primary"
      return [
        "btn",
        "btn--primary",
        "bg-primary",
        "text-black",
        "hover:opacity-90",
        "focus-visible:ring-2",
        "focus-visible:ring-primary/60",
      ].join(" ");
    case "solid":
    default:
      return [
        "btn",
        "btn--solid",
        "bg-white/10",
        "text-white",
        "hover:bg-white/15",
        "focus-visible:ring-2",
        "focus-visible:ring-white/30",
      ].join(" ");
  }
}

export function Button({
  className = "",
  variant = "solid",
  ...rest
}: Props) {
  const base = [
    classesForVariant(variant),
    "inline-flex items-center justify-center rounded-2xl",
    "px-4 py-2 text-sm font-medium select-none",
    "transition-colors",
  ].join(" ");

  return <button className={`${base} ${className}`.trim()} {...rest} />;
}

export default Button;
