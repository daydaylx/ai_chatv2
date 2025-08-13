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
    return () => {
      cancelled = true;
    };
  }, [client]);

  /** Modelle mit Kompatibilitätsflag (id kann laut Typen fehlen -> defensiv behandeln) */
  const withCompat = useMemo(
    () =>
      models.map((m) => {
        const id = m.id ?? ""; // fallback für optionale Typen
        const allowed = id ? isModelAllowedByPreset(preset, id) : false;
        return { model: m, id, allowed };
      }),
    [models, preset]
  );

  /** Aktuell gewähltes Modell kompatibel? (value ist string, aber wir coalescen defensiv) */
  const currentAllowed = useMemo(() => {
    const id = value ?? "";
    return id ? isModelAllowedByPreset(preset, id) : true;
  }, [preset, value]);

  return (
    <div className="space-y-3">
      <select
        className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Modell wählen"
      >
        <option value="">— Modell wählen —</option>
        {withCompat.map(({ model: m, id, allowed }, idx) => {
          const label = (m.name ?? id) || "Unbenanntes Modell";
          return (
            <option
              key={id || m.name || `m-${idx}`}
              value={id}
              disabled={!allowed || !id}
            >
              {label + (!allowed ? " (inkompatibel)" : "")}
            </option>
          );
        })}
      </select>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground flex items-center gap-2"
        >
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Modelle werden geladen...
        </motion.div>
      )}

      {err && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-destructive"
        >
          Fehler: {err}
        </motion.div>
      )}

      {!currentAllowed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-warn bg-warn/10 p-3 rounded-lg border border-warn/20"
        >
          Das aktuelle Modell ist mit dem gewählten Stil nicht kompatibel.
        </motion.div>
      )}
    </div>
  );
}
