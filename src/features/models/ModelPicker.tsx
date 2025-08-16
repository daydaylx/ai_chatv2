import { useMemo } from "react";
import { motion } from "framer-motion";

type ModelInfo = {
  id: string;
  name?: string;
  label?: string;
  vendor?: string;
  family?: string;
  group?: string;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
  models?: ModelInfo[];
  loading?: boolean;
};

export default function ModelPicker({ value, onChange, models = [], loading }: Props) {
  const grouped = useMemo(() => {
    const by = new Map<string, ModelInfo[]>();
    for (const m of models) {
      const g = m.vendor || m.family || m.group || "Allgemein";
      if (!by.has(g)) by.set(g, []);
      by.get(g)!.push(m);
    }
    return Array.from(by.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [models]);

  const currentLabel = useMemo(() => {
    const m = models.find((x) => x.id === value);
    return m?.name || m?.label || value || "–";
  }, [models, value]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/60 bg-secondary/60 px-3 py-2"
      >
        {loading ? (
          <div className="text-sm text-muted-foreground">Modelle werden geladen…</div>
        ) : (
          <select
            className="w-full bg-transparent text-sm outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {/* Fallback: Falls keine Gruppen erkannt werden */}
            {grouped.length === 0 &&
              models.map((m) => {
                const label = m.name || m.label || m.id;
                return (
                  <option key={m.id} value={m.id}>
                    {label}
                  </option>
                );
              })}

            {/* Gruppierte Darstellung */}
            {grouped.map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((m) => {
                  const label = m.name || m.label || m.id;
                  return (
                    <option key={m.id} value={m.id}>
                      {label}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        )}
        <div className="mt-1 text-xs text-muted-foreground">Ausgewählt: {currentLabel}</div>
      </motion.div>
    </div>
  );
}
