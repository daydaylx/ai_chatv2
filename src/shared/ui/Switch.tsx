import React from "react";

type Props = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  id?: string;
};

export function Switch({ checked, onCheckedChange, label, id }: Props) {
  const switchId = id ?? `sw-${Math.random().toString(36).slice(2,8)}`;
  return (
    <label htmlFor={switchId} className="inline-flex items-center gap-3 cursor-pointer select-none">
      <span className="relative inline-flex items-center">
        <input
          id={switchId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e)=>onCheckedChange(e.target.checked)}
        />
        <span className="w-11 h-6 rounded-full bg-white/15 transition peer-checked:bg-accent/60" />
        <span className="absolute left-0 top-0 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      {label ? <span className="text-sm opacity-80">{label}</span> : null}
    </label>
  );
}
