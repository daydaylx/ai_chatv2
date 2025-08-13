import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { getPresetById, isModelAllowedByPreset } from "../../lib/presets";
import clsx from "clsx";

type Props = {
  value: string;
  onChange: (id: string) => void;
  client: OpenRouterClient;
  personaId?: string;
};

export function ModelPicker({ value, onChange, client, personaId }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const preset = useMemo(() => getPresetById(personaId || ""), [personaId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const list = await client.listModels();
        if (!cancelled) setModels(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [client]);

  const annotated = useMemo(() => {
    return models.map(m => ({
      model: m,
      allowed: isModelAllowedByPreset(preset, m.id),
      provider: m.id.includes("/") ? m.id.split("/")[0] : "Andere",
      label: m.name ?? m.id
    }));
  }, [models, preset]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term
      ? annotated.filter(a => (a.label + " " + a.model.id).toLowerCase().includes(term))
      : annotated;
  }, [annotated, q]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof annotated>();
    filtered.forEach(a => {
      const arr = map.get(a.provider) ?? [];
      arr.push(a as any);
      map.set(a.provider, arr);
    });
    // sort provider alphabetisch; innerhalb allowed zuerst
    const ordered = Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b));
    return ordered.map(([provider, list]) => ({
      provider,
      list: list.sort((a:any,b:any) => Number(b.allowed) - Number(a.allowed) || (a.label).localeCompare(b.label))
    }));
  }, [filtered]);

  const currentAllowed = useMemo(() => (value ? isModelAllowedByPreset(preset, value) : true), [preset, value]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Modelle suchen…"
          className="flex-1 h-11 px-3 rounded-xl bg-secondary/60 border border-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-white/10">
        {loading && (
          <div className="p-3 text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Modelle werden geladen…
          </div>
        )}
        {err && <div className="p-3 text-sm text-destructive">Fehler: {err}</div>}

        {!loading && !err && (
          <ul className="divide-y divide-white/5">
            {groups.map(g => (
              <li key={g.provider}>
                <div className="sticky top-0 z-[1] bg-card/80 backdrop-blur px-3 py-2 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  {g.provider}
                </div>
                <div className="grid grid-cols-1">
                  {g.list.map(({ model: m, allowed, label }) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => allowed && onChange(m.id)}
                      className={clsx(
                        "text-left px-3 py-3 hover:bg-card/60 transition-colors",
                        value === m.id ? "bg-primary/15" : "",
                        !allowed && "opacity-60 cursor-not-allowed"
                      )}
                      aria-disabled={!allowed}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{label}</div>
                          <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">{m.id}</div>
                        </div>
                        {!allowed && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            Inkompatibel
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!currentAllowed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-amber-400/90">
          Das aktuelle Modell ist mit dem gewählten Stil nicht kompatibel.
        </motion.div>
      )}
    </div>
  );
}
