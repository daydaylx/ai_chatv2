import React from "react";
export function Spinner({ size=16 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="animate-spin opacity-80">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25"/>
      <path d="M21.5 12a9.5 9.5 0 0 1-9.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
