import { useEffect, useMemo, useState } from "react";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { getPresetById, isModelAllowedByPreset } from "../../lib/presets";

type Props = {
  value: string;
  onChange: (id: string) => void;
  client: OpenRouterClient;
  personaId?: string; // optional: zur Filterung kompatibler Modelle
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
    return () => { cancelled = true; };
  }, [client]);

  const withCompat = useMemo(() => {
    return models.map(m => ({
      model: m,
      allowed: isModelAllowedByPreset(preset, m.id)
    }));
  }, [models, preset]);

  const currentAllowed = useMemo(() => {
    return value ? isModelAllowedByPreset(preset, value) : true;
  }, [preset, value]);

  return (
    <div className="field" title={preset ? `Persona: ${preset.label}` : undefined}>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Modell wählen"
      >
        <option value="">— Modell wählen —</option>
        {withCompat.map(({ model: m, allowed }) => (
          <option key={m.id} value={m.id} disabled={!allowed}>
            {m.name ?? m.id}{!allowed ? " (inkompatibel mit Stil)" : ""}
          </option>
        ))}
      </select>
      {loading && <div className="hint">Laden…</div>}
      {err && <div className="hint">Fehler: {err}</div>}
      {!currentAllowed && (
        <div className="hint">Das aktuelle Modell ist mit dem gewählten Stil nicht kompatibel.</div>
      )}
    </div>
  );
}
