import { useMemo, useState } from "react";
import { Sheet } from "../../shared/ui/Sheet";
import { useSettings } from "../../entities/settings/store";
import { ModelPicker } from "../models/ModelPicker";
import { OpenRouterClient } from "../../lib/openrouter";

type Props = { open: boolean; onClose: () => void };

export function SettingsSheet({ open, onClose }: Props) {
  const { modelId, setModelId, personaId } = useSettings();
  const client = useMemo(() => new OpenRouterClient(), []);
  const [key, setKey] = useState<string>(() => client.getApiKey());

  function saveKey() { client.setApiKey(key.trim()); }
  function clearKey() { client.clearApiKey(); setKey(""); }

  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen"
      footer={<div className="flex gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border">Schließen</button>
      </div>}
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">API-Key</h3>
          <div className="flex gap-2">
            <input
              type="password"
              className="flex-1 rounded-xl border border-border bg-transparent px-3 py-2"
              placeholder="sk-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
            />
            <button onClick={saveKey} className="px-3 rounded-xl bg-primary text-primary-foreground">Speichern</button>
            <button onClick={clearKey} className="px-3 rounded-xl border border-border">Löschen</button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Modell</h3>
          <ModelPicker
            value={modelId ?? ""}
            onChange={(id) => setModelId(id || null)}
            client={client}
            personaId={personaId ?? undefined}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Stil</h3>
          <p className="text-sm text-muted-foreground">
            Stil-Auswahl bleibt wie gehabt im separaten Dialog.
          </p>
        </section>
      </div>
    </Sheet>
  );
}
