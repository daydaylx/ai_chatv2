import { ButtonHTMLAttributes } from "react";

type Variant = "ghost" | "solid" | "primary";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

/**
 * Minimaler, A11y-freundlicher Button.
 * - variant "primary" wird intern auf "solid" gemappt (Test-Kompatibilität).
 */
export function Button({ className = "", variant = "solid", ...rest }: Props) {
  const resolved = variant === "primary" ? "solid" : variant;
  const base = resolved === "ghost" ? "btn btn--ghost" : "btn";
  return <button className={`${base} ${className}`} {...rest} />;
}

export default Button;
