import * as React from "react";

export type ModelInfo = {
  id: string;
  label?: string;
  description?: string;
  badges?: string[];
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
};

type Props = {
  models: ModelInfo[];
  selectedId?: string;
  onSelect: (id: string) => void;
  compact?: boolean;
  showBadges?: boolean;
};

function displayLabel(m: ModelInfo) {
  return m.label?.trim() || m.id;
}
function displaySubtitle(m: ModelInfo) {
  const parts: string[] = [];
  if (m.description) parts.push(m.description.trim());
  return parts.join(" · ");
}

export default function ModelPicker({
  models,
  selectedId,
  onSelect,
  compact = false,
  showBadges = true,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [focusIndex, setFocusIndex] = React.useState<number>(() =>
    Math.max(0, models.findIndex((m) => m.id === selectedId))
  );

  React.useEffect(() => {
    const idx = models.findIndex((m) => m.id === selectedId);
    if (idx >= 0) setFocusIndex(idx);
  }, [selectedId, models]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!models.length) return;
    if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); setFocusIndex((i) => Math.min(models.length - 1, i + 1)); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); setFocusIndex((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const m = models[focusIndex]; if (m) onSelect(m.id); }
  };

  return (
    <div ref={containerRef} role="listbox" aria-label="Modelle" tabIndex={0} onKeyDown={onKeyDown} className="flex flex-col gap-2 outline-none">
      {models.map((m, i) => {
        const label = displayLabel(m);
        const subtitle = displaySubtitle(m);
        const selected = m.id === selectedId;
        const focused = i === focusIndex;

        return (
          <button
            key={m.id}
            type="button"
            role="option"
            aria-selected={selected}
            title={subtitle ? `${label}\n${subtitle}` : label}
            onClick={() => onSelect(m.id)}
            onFocus={() => setFocusIndex(i)}
            className={[
              "w-full text-left rounded-xl transition-colors",
              compact ? "min-h-[44px] p-2" : "min-h-[52px] p-3",
              selected
                ? "bg-[hsl(var(--accent-600))]/15 ring-2 ring-[hsl(var(--accent-600))]"
                : focused
                ? "bg-white/6"
                : "bg-white/[0.04] hover:bg-white/[0.07]",
              "border border-white/10",
            ].join(" ")}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={["shrink-0 rounded-md", compact ? "h-6 w-6" : "h-7 w-7", selected ? "bg-[hsl(var(--accent-600))]" : "bg-white/15"].join(" ")} aria-hidden />
              <div className="flex-1 min-w-0">
                <div className={["font-medium truncate", compact ? "text-[13px]" : "text-sm"].join(" ")}>{label}</div>
                {subtitle ? <div className={["truncate", compact ? "text-[11px]" : "text-xs", "text-white/70"].join(" ")}>{subtitle}</div> : null}
              </div>
              {showBadges ? (
                <div className="shrink-0 flex items-center gap-1">
                  {m.free ? <Badge>free</Badge> : null}
                  {m.allow_nsfw ? <Badge>18+</Badge> : null}
                  {m.fast ? <Badge>fast</Badge> : null}
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] leading-4 px-1.5 py-0.5 rounded bg-white/10 text-white/90">{children}</span>;
}
