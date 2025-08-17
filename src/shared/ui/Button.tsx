import React, { ButtonHTMLAttributes } from "react";

type Variant = "ghost" | "solid" | "primary";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

/** Visuell bleibt Theme zuständig; für Tests markiert 'primary' mit 'bg-primary'. */
export function Button({ className = "", variant = "solid", ...rest }: Props) {
  let cls = "btn";
  if (variant === "ghost") cls += " btn--ghost";
  else cls += " btn--solid";
  if (variant === "primary") cls += " bg-primary"; // nur Marker
  return <button className={`${cls} ${className}`.trim()} {...rest} />;
}
export default Button;
