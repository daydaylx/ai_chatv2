import * as React from "react";
import { cn } from "../lib/cn";
import Button from "./Button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export default function Sheet({ open, onOpenChange, title, className, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className={cn("relative w-full sm:max-w-lg m-0 sm:m-4 p-4 sm:p-5 glass-sheet", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">{title}</div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Schließen</Button>
        </div>
        <div className="max-h-[80svh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}
