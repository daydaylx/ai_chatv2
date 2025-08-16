import React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export const Textarea: React.FC<Props> = ({ label, hint, className = "", ...rest }) => {
  const id = React.useId();
  return (
    <label htmlFor={id} className="block space-y-1.5">
      {label && <span className="text-sm font-medium">{label}</span>}
      <textarea id={id} className={`textarea w-full min-h-[120px] ${className}`} {...rest} />
      {hint && <span className="text-xs muted">{hint}</span>}
    </label>
  );
};
