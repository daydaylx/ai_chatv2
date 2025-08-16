import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { OpenRouterClient } from "@/lib/openrouter";

type Props = {
  open: boolean;
  onClose: () => void;
  client: OpenRouterClient;
  modelId: string;
  onModelChange: (id: string) => void;
  onKeyChanged: () => void;
};

export default function SettingsDrawer({
  open,
  onClose,
  client,
  modelId,
  onModelChange,
  onKeyChanged
}: Props) {
  const [key, setKey] = useState<string>(() => client.getApiKey() || "");
  const [models, setModels] = useState<{ id: string; name: string; provider?: string }[]>([]);

  useEffect(() => {
    client.listModels().then(setModels).catch(() => setModels([]));
  }, [client]);

  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; name: string; provider?: string }[]>();
    for (const m of models) {
      const g = m.provider ?? "Andere";
      map.set(g, [...(map.get(g) ?? []), m]);
    }
    return [...map.entries()];
  }, [models]);

  function saveKey() {
    if (key.trim()) {
      client.setApiKey(key.trim());
    } else {
      client.clearApiKey();
    }
    onKeyChanged();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border border-border bg-background p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold">Einstellungen</h2>

          {/* API Key */}
          <div className="mb-6">
            <label className="mb-1 block text-sm text-muted-foreground">OpenRouter API-Key</label>
            <input
              className="w-full rounded-xl border border-border/60 bg-secondary/60 px-3 py-2"
              placeholder="sk-or-v1-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={saveKey}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Speichern
              </button>
              <button
                onClick={() => {
                  client.clearApiKey();
                  setKey("");
                  onKeyChanged();
                }}
                className="rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Entfernen
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="mb-6">
            <label className="mb-1 block text-sm text-muted-foreground">Modell</label>
            <select
              className="w-full rounded-xl border border-border/60 bg-secondary/60 px-3 py-2"
              value={modelId}
              onChange={(e) => onModelChange(e.target.value)}
            >
              <option value="">– Modell wählen –</option>
              {grouped.map(([group, list]) => (
                <optgroup key={group} label={group}>
                  {list.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Fertig
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
