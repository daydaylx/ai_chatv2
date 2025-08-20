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
        "h-6 w-11 rounded-full relative transition",
        checked ? "bg-[hsl(var(--accent-600))]" : "bg-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          checked ? "left-[26px]" : "left-0.5",
        ].join(" ")}
      />
    </button>
  );
}
