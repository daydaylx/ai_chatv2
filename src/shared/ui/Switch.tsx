import * as React from "react";

type Props = { checked: boolean; onCheckedChange: (v: boolean) => void; };

export default function Switch({ checked, onCheckedChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={[
        "w-10 h-6 rounded-full transition-colors border border-white/12",
        checked ? "bg-[hsl(var(--accent-600))]" : "bg-white/10"
      ].join(" ")}
    >
      <span className={["block w-5 h-5 bg-white rounded-full transition-transform", checked ? "translate-x-5" : "translate-x-0.5"].join(" ")} />
    </button>
  );
}
