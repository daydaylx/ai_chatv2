import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ModelPicker from "@/features/models/ModelPicker";
import type { OpenRouterClient } from "@/lib/openrouter";

type ModelInfo = {
  id: string;
  name?: string;
  label?: string;
  vendor?: string;
  family?: string;
  group?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  client: OpenRouterClient;
  modelId: string;
  onModelChange: (id: string) => void;
  onKeyChanged: () => void;
  personaLabel?: string;
  onOpenPersona: () => void;
  models?: ModelInfo[];
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
  models: modelsProp,
}: Props) {
  const [key, setKey] = useState<string>(() => client.getApiKey() ?? "");
  const [loadingModels, setLoadingModels] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>(modelsProp ?? []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (modelsProp && modelsProp.length) return;
      setLoadingModels(true);
      try {
        const res = await fetch("/models.json", { cache: "no-cache" });
        const data = (await res.json()) as ModelInfo[] | { models: ModelInfo[] };
        const list = Array.isArray(data) ? data : data.models ?? [];
        if (!ignore) setModels(list);
      } catch {
      } finally {
        if (!ignore) setLoadingModels(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [modelsProp]);

  const currentLabel = useMemo(() => {
    const m = models.find((x) => x.id === modelId);
    return m?.name || m?.label || modelId || "–";
  }, [models, modelId]);

  function saveKey() {
    client.setApiKey(key.trim());
    onKeyChanged();
  }

  function clearKey() {
    setKey("");
    client.setApiKey("");
    onKeyChanged();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border border-border bg-background p-4 md:p-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Einstellungen</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="h-9 w-9 rounded-lg border border-border/60 bg-secondary/60 text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </motion.button>
          </div>

          {/* Persona */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium">Antwort-Stil (Persona)</div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/60 px-3 py-2">
              <div className="text-sm">
                {personaLabel ? (
                  <span className="text-foreground">{personaLabel}</span>
                ) : (
                  <span className="text-muted-foreground">Keine Persona gewählt</span>
                )}
              </div>
              <button
                onClick={onOpenPersona}
                className="rounded-lg border border-border/60 bg-background/70 px-3 py-1 text-sm hover:bg-secondary/50"
              >
                Ändern
              </button>
            </div>
          </div>

          {/* API-Key */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium">OpenRouter API-Key</div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="flex-1 rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
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
                Entfernen
              </button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Status: {key ? "gesetzt" : "nicht gesetzt"}
            </div>
          </div>

          {/* Model */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium">Modell</div>
            <ModelPicker
              value={modelId}
              onChange={onModelChange}
              models={models}
              loading={loadingModels}
            />
            <div className="mt-1 text-xs text-muted-foreground">Aktuell: {currentLabel}</div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Fertig
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
