import { useEffect, useState } from "react";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";

type Props = {
  value: string;
  onChange: (id: string) => void;
  client: OpenRouterClient;
};

export function ModelPicker({ value, onChange, client }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const list = await client.listModels();
        if (!cancelled) setModels(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [client]);

  return (
    <div className="field">
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Modell wählen">
        <option value="">— Modell wählen —</option>
        {models.map(m => (<option key={m.id} value={m.id}>{m.name ?? m.id}</option>))}
      </select>
      {loading && <div className="hint">Laden…</div>}
      {err && <div className="hint">Fehler: {err}</div>}
    </div>
  );
}
