import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { useConfigStore } from "../../entities/config/store";

type Props = {
  open: boolean;
  onClose: () => void;
  client: OpenRouterClient;
  modelId: string | "";
  onModelChange: (id: string) => void;
  onKeyChanged: () => void;
  personaLabel?: string;
  onOpenPersona: () => void;
  personaId: string;
};

export default function SettingsDrawer({
  open,
  onClose,
  client,
  modelId,
  onModelChange,
  onKeyChanged,
  personaLabel,
  onOpenPersona,
}: Props) {
  const [key, setKey] = useState<string>(() => client.getApiKey());
  const { models, load, loaded, loading, reload } = useConfigStore();

  useEffect(() => {
    if (open && !loaded && !loading) void load();
  }, [open, loaded, loading, load]);

  const sorted = useMemo<OpenRouterModel[]>(
    () => [...models].sort((a, b) => (a.vendor || "").localeCompare(b.vendor || "") || a.id.localeCompare(b.id)),
    [models]
  );

  function saveKey() {
    client.setApiKey(key.trim());
    onKeyChanged();
  }
  function clearKey() {
    client.clearApiKey();
    setKey("");
    onKeyChanged();
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
      <motion.aside
        className="fixed right-0 top-0 z-50 h-full w-[92vw] max-w-md border-l border-border bg-background shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="text-sm font-semibold">Einstellungen</div>
            <button
              className="rounded-lg border border-border/60 bg-secondary/60 px-3 py-1 text-sm"
              onClick={onClose}
            >
              Schließen
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {/* API Key */}
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

            {/* Persona */}
            <section>
              <div className="mb-2 text-sm font-medium">Antwort-Stil</div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {personaLabel ?? "Neutral"}
                </div>
                <button
                  onClick={onOpenPersona}
                  className="rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-sm"
                >
                  Auswählen…
                </button>
              </div>
            </section>

            {/* Modelle */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Modell</span>
                <button
                  onClick={() => reload()}
                  className="rounded-lg border border-border/60 bg-secondary/60 px-2 py-1 text-xs"
                >
                  Neu laden
                </button>
              </div>
              {!loaded ? (
                <div className="text-sm text-muted-foreground">Lade Modelle…</div>
              ) : (
                <select
                  className="w-full rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                  value={modelId || ""}
                  onChange={(e) => onModelChange(e.target.value)}
                >
                  <option value="" disabled>
                    Modell wählen…
                  </option>
                  {sorted.map((m) => (
                    <option key={m.id} value={m.id}>
                      {(m.name || m.id) + (m.vendor ? ` — ${m.vendor}` : "")}
                    </option>
                  ))}
                </select>
              )}
            </section>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
