/**
 * Was & Warum:
 * Fix für Layout-Brüche bei langen Modellnamen/Beschreibungen:
 * - Einzeilige Truncation (mit Ellipsis) + title-Tooltip (Option A, kein Plugin nötig).
 * - Tap-Targets min. 44px; Fokus-Ring sichtbar; keine Layout-Shifts.
 */
import * as React from "react";

export type ModelInfo = {
  id: string;
  label?: string;
  description?: string;
  badges?: Array<string>;
};

type Props = {
  models: ModelInfo[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export default function ModelPicker({ models, selectedId, onSelect }: Props) {
  return (
    <div role="list" className="w-full">
      {models.map((m) => {
        const label = m.label || m.id;
        const subtitle = m.description || m.id;
        const isActive = m.id === selectedId;

        return (
          <button
            key={m.id}
            role="listitem"
            type="button"
            onClick={() => onSelect(m.id)}
            title={`${label} — ${subtitle}`}
            className={[
              "w-full min-h-[44px] px-3 py-2 rounded-lg text-left",
              "flex items-center gap-3",
              "hover:bg-muted/60 active:bg-muted/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive ? "bg-muted/70" : ""
            ].join(" ")}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{label}</div>
              <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
            </div>
            {m.badges?.length ? (
              <div className="flex items-center gap-1 shrink-0">
                {m.badges.slice(0, 3).map((b, i) => (
                  <span
                    key={i}
                    className="text-[10px] leading-4 px-1.5 py-0.5 rounded bg-muted text-foreground/90"
                  >
                    {b}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
