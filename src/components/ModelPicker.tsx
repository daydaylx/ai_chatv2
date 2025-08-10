import { useEffect, useState } from "react";
import { OpenRouterClient, OpenRouterModel } from "@/lib/openrouter";

type Props = {
  apiKey: string;
  value: string | null;
  onChange: (modelId: string) => void;
  disabled?: boolean;
};

export default function ModelPicker({ apiKey, value, onChange, disabled }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!apiKey) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const client = new OpenRouterClient(apiKey);
        const list = await client.listModelsCached();
        if (!alive) return;
        list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        setModels(list);
        if (!value && list.length) onChange(list[0].id);
      } catch (e: any) {
        setErr(e?.message ?? "Fehler beim Laden der Modelle");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [apiKey]);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label style={{ fontSize: 14, opacity: 0.8 }}>Modell:</label>
      <select
        disabled={disabled || !models.length || loading}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          height: 44,
          borderRadius: 10,
          border: "1px solid #2a2a38",
          background: "#181822",
          color: "white",
          padding: "0 10px",
          fontSize: 14
        }}
      >
        {!value && <option value="">– wählen –</option>}
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name ? `${m.name} (${m.id})` : m.id}
          </option>
        ))}
      </select>
      {loading && <span className="small">lädt…</span>}
      {err && <span className="small" style={{ color: "#ef4444" }}>{err}</span>}
    </div>
  );
}
