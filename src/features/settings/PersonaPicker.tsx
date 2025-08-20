import * as React from "react";
import personasRaw from "../../data/personas.json";

type Persona = {
  id: string;
  label?: string;
  name?: string;           // Fallback
  description?: string;
  allow?: string[];
  deny?: string[];
  system?: string;
};

type Props = {
  selectedId?: string;
  onSelect: (id: string) => void;
  showSearch?: boolean;
  compact?: boolean;
};

function normalize(p: any): Persona {
  return {
    id: String(p?.id ?? "").trim(),
    label: typeof p?.label === "string" ? p.label.trim() : undefined,
    name: typeof p?.name === "string" ? p.name.trim() : undefined,
    description: typeof p?.description === "string" ? p.description.trim() : undefined,
    allow: Array.isArray(p?.allow) ? p.allow.filter(Boolean) : undefined,
    deny: Array.isArray(p?.deny) ? p.deny.filter(Boolean) : undefined,
    system: typeof p?.system === "string" ? p.system : undefined,
  };
}
function titleOf(p: Persona) {
  return p.label?.trim() || p.name?.trim() || p.id;
}
function subtitleOf(p: Persona) {
  return p.description || "";
}

export default function PersonaPicker({
  selectedId,
  onSelect,
  showSearch = true,
  compact = false,
}: Props) {
  const personas: Persona[] = React.useMemo(
    () => (Array.isArray(personasRaw) ? personasRaw.map(normalize).filter(x => x.id) : []),
    []
  );
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!q.trim()) return personas;
    const s = q.trim().toLowerCase();
    return personas.filter(p =>
      titleOf(p).toLowerCase().includes(s) ||
      subtitleOf(p).toLowerCase().includes(s) ||
      p.id.toLowerCase().includes(s)
    );
  }, [q, personas]);

  return (
    <div className="space-y-3">
      {showSearch ? (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Personas durchsuchen…"
          className={[
            "w-full rounded-xl",
            "bg-white/[0.06] border border-white/12",
            "px-3", compact ? "h-9 text-sm" : "h-11 text-base",
            "placeholder:text-white/60 text-white",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-600))]",
          ].join(" ")}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        {filtered.map((p) => {
          const selected = p.id === selectedId;
          const title = titleOf(p);
          const sub = subtitleOf(p);

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={selected}
              title={sub ? `${title}\n${sub}` : title}
              className={[
                "w-full text-left rounded-xl transition-colors",
                compact ? "min-h-[44px] p-2" : "min-h-[52px] p-3",
                selected
                  ? "bg-[hsl(var(--accent-600))]/15 ring-2 ring-[hsl(var(--accent-600))]"
                  : "bg-white/[0.04] hover:bg-white/[0.07] border border-white/10",
              ].join(" ")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={[
                    "shrink-0 rounded-md",
                    compact ? "h-6 w-6" : "h-7 w-7",
                    selected ? "bg-[hsl(var(--accent-600))]" : "bg-white/15",
                  ].join(" ")}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className={["font-medium truncate", compact ? "text-[13px]" : "text-sm"].join(" ")}>
                    {title}
                  </div>
                  {sub ? (
                    <div className={["text-muted-foreground truncate", compact ? "text-[11px]" : "text-xs"].join(" ")}>
                      {sub}
                    </div>
                  ) : null}
                </div>
                {selected ? (
                  <span className="shrink-0 text-[12px] px-2 py-0.5 rounded bg-[hsl(var(--accent-600))]/20">
                    aktiv
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
