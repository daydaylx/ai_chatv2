import * as React from "react";
export function Spinner({ size=16 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" fill="none"/>
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none"/>
    </svg>
  );
}
