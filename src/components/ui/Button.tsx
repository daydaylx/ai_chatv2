import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export const Button: React.FC<Props> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) => {
  const v =
    variant === "primary"
      ? "btn btn-primary"
      : variant === "secondary"
      ? "btn btn-secondary"
      : "btn btn-ghost";
  const s = size === "sm" ? "text-sm px-3 py-1.5" : "";
  return (
    <button className={`${v} ${s} ${className}`} {...rest}>
      {children}
    </button>
  );
};
