import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "solid" };

export function Button({ className = "", variant = "solid", ...rest }: Props) {
  const base = variant === "ghost" ? "btn btn--ghost" : "btn";
  return <button className={`${base} ${className}`} {...rest} />;
}
