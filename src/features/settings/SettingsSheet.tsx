import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";

type Props = {
  open: boolean;
  onClose: () => void;
  client: OpenRouterClient;
  modelId: string | "";
  onModelChange: (id: string) => void;
};

export default function SettingsSheet({ open, onClose, client, modelId, onModelChange }: Props) {
  const [key, setKey] = useState<string>(() => client.getApiKey());
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    client
      .listModels()
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [open, client]);

  const sorted = useMemo(
    () =>
      [...models].sort((a, b) => (a.vendor || "").localeCompare(b.vendor || "") || a.id.localeCompare(b.id)),
    [models]
  );

  function saveKey() {
    client.setApiKey(key.trim());
  }
  function clearKey() {
    client.clearApiKey();
    setKey("");
  }

  if (!open) return null;

  return (
    <>
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
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Einstellungen</div>
            <button className="rounded-lg border border-border/60 bg-secondary/60 px-3 py-1 text-sm" onClick={onClose}>
              Schließen
            </button>
          </div>

          <section>
            <div className="mb-2 text-sm font-medium">OpenRouter API Key</div>
            <div className="flex gap-2">
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-or-..."
                className="flex-1 rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={saveKey}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Speichern
              </button>
              <button
                onClick={clearKey}
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive hover:bg-destructive/20"
              >
                Löschen
              </button>
            </div>
          </section>

          <section>
            <div className="mb-2 text-sm font-medium">Modell</div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Lade Modelle…</div>
            ) : (
              <select
                className="w-full rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                value={modelId || ""}
                onChange={(e) => onModelChange(e.target.value)}
              >
                <option value="" disabled>Modell wählen…</option>
                {sorted.map((m) => (
                  <option key={m.id} value={m.id}>{(m.name || m.id) + (m.vendor ? ` — ${m.vendor}` : "")}</option>
                ))}
              </select>
            )}
          </section>
        </div>
      </motion.div>
    </>
  );
}
