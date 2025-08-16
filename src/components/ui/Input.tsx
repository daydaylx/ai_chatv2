import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export const Input: React.FC<Props> = ({ label, hint, className = "", ...rest }) => {
  const id = React.useId();
  return (
    <label htmlFor={id} className="block space-y-1.5">
      {label && <span className="text-sm font-medium">{label}</span>}
      <input id={id} className={`input w-full ${className}`} {...rest} />
      {hint && <span className="text-xs muted">{hint}</span>}
    </label>
  );
};
