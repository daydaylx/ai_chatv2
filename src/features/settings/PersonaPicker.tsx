import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
// Deine bestehende personas.json – NICHT ändern:
import raw from "../../data/personas.json";

type Persona = {
  id: string;
  name: string;
  description?: string;
  allow?: string[];
  deny?: string[];
  // weitere Felder bleiben unbeachtet
};

type Props = {
  /** Aktuell ausgewählte Persona-ID */
  value: string;
  /** Auswahländerung */
  onChange: (id: string) => void;
  /** Optional: Suchfeld anzeigen (default true) */
  showSearch?: boolean;
};

function extractPersonas(anyRaw: any): Persona[] {
  // Unterstützt:
  //  A) Array mit Persona-Objekten
  if (Array.isArray(anyRaw)) {
    return anyRaw.filter((p) => p && p.id && p.name);
  }
  //  B) Objekt mit { personas: [...] }
  if (anyRaw && typeof anyRaw === "object" && Array.isArray(anyRaw.personas)) {
    return anyRaw.personas.filter((p: any) => p && p.id && p.name);
  }
  return [];
}

export default function PersonaPicker({ value, onChange, showSearch = true }: Props) {
  const personas = useMemo<Persona[]>(() => extractPersonas(raw), []);
  const [search, setSearch] = useState("");

  // Wenn value ungültig, auf erste Persona setzen
  useEffect(() => {
    if (!personas.length) return;
    const firstPersona = personas[0];
    if (!value || !personas.some((p) => p.id === value)) {
      if (firstPersona) {
        onChange(firstPersona.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personas, value]);

  const filtered = useMemo(() => {
    if (!showSearch) return personas;
    const q = search.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [personas, search, showSearch]);

  return (
    <div className="space-y-3">
      {showSearch && (
        <input
          type="text"
          placeholder="Stil suchen…"
          className="w-full px-4 py-3 rounded-lg text-sm bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Stile durchsuchen"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={clsx(
                "text-left p-4 rounded-xl border transition-all",
                active
                  ? "bg-primary/20 border-primary/50 ring-2 ring-primary/30"
                  : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
              )}
              aria-pressed={active}
              aria-label={`Persona ${p.name} auswählen`}
            >
              <div className="font-semibold text-base">{p.name}</div>
              {p.description && (
                <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">Keine passenden Stile gefunden.</div>
      )}
    </div>
  );
}
