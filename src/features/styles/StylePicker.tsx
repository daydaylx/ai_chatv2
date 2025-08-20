import * as React from "react";

export type StyleInfo = {
  id: string;
  name: string;
  description?: string;
  system?: string;
};

type Props = {
  styles: StyleInfo[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

export default function StylePicker({ styles, selectedId, onSelect }: Props) {
  const [focus, setFocus] = React.useState(0);

  React.useEffect(() => {
    const idx = Math.max(0, styles.findIndex((s) => s.id === selectedId));
    setFocus(idx);
  }, [selectedId, styles]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!styles.length) return;
    if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); setFocus((i) => Math.min(styles.length - 1, i + 1)); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); setFocus((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const s = styles[focus]; if (s) onSelect(s.id); }
  };

  return (
    <div role="listbox" tabIndex={0} onKeyDown={onKey} className="flex flex-col gap-2 outline-none">
      {styles.map((s, i) => {
        const selected = s.id === selectedId;
        const focused = i === focus;
        return (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(s.id)}
            onFocus={() => setFocus(i)}
            className={[
              "w-full text-left rounded-xl transition-colors min-h-[52px] p-3 border",
              selected ? "bg-[hsl(var(--accent-600))]/15 ring-2 ring-[hsl(var(--accent-600))]" :
              focused ? "bg-white/6" : "bg-white/[0.04] hover:bg-white/[0.07]",
              "border-white/10",
            ].join(" ")}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className={["shrink-0 rounded-md h-7 w-7", selected ? "bg-[hsl(var(--accent-600))]" : "bg-white/15"].join(" ")} aria-hidden />
              <div className="min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                {s.description ? <div className="text-xs text-white/70 truncate">{s.description}</div> : null}
              </div>
            </div>
          </button>
        );
      })}
      {styles.length === 0 && <div className="text-sm text-white/70">Keine Stile verfügbar.</div>}
    </div>
  );
}
