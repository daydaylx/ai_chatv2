import * as React from "react";
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] leading-4 px-1.5 py-0.5 rounded bg-white/10 text-white/90">{children}</span>;
}
export default Badge;
