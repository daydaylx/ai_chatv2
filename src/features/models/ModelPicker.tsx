import { useEffect, useState } from 'react';
import type { OpenRouterModel } from '../../lib/openrouter';
import { OpenRouterClient } from '../../lib/openrouter';

export type Props = {
  value?: string;
  onChange: (modelId: string) => void;
  client?: OpenRouterClient;
};

export function ModelPicker({ value, onChange, client }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let ignore = false;
    const c = client ?? new OpenRouterClient();
    setLoading(true);
    c.listModels()
      .then((list) => { if (!ignore) setModels(list); })
      .catch((e: any) => { if (!ignore) setErr(String(e?.message ?? e)); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [client]);

  if (loading && models.length === 0) return <p>Modelle laden…</p>;
  if (err) return <p style={{ color: 'crimson' }}>Fehler beim Laden der Modelle: {err}</p>;

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: 8, minWidth: 260 }}
    >
      <option value="" disabled>Bitte Modell wählen…</option>
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name ?? m.id}
        </option>
      ))}
    </select>
  );
}
