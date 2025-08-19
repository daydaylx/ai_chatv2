import React from "react";
import Button from "../shared/ui/Button";
import { useSettings } from "../entities/settings/store";
import { PersonaContext } from "../entities/persona";
import { SettingsContext } from "../widgets/shell/AppShell";
import { useMemory } from "../entities/memory/store";

export default function Header() {
  const openSettings = React.useContext(SettingsContext);
  const { data } = React.useContext(PersonaContext);
  const settings = useSettings();
  const memory = useMemory();

  const modelName = React.useMemo(() => {
    const m = data.models.find(x => x.id === settings.modelId);
    return m?.name ?? settings.modelId ?? "Modell wählen";
  }, [data.models, settings.modelId]);

  const styleName = React.useMemo(() => {
    const s = data.styles.find(x => x.id === (settings.personaId ?? ""));
    return s?.name ?? settings.personaId ?? "Stil wählen";
  }, [data.styles, settings.personaId]);

  const chip = "px-3 h-9 rounded-full border border-1 text-sm hover:bg-accent-soft max-w-[44vw] truncate";

  return (
    <div className="sticky top-0 inset-x-0 z-40 bg-surface-2/85 backdrop-blur border-b border-1">
      <div className="px-4 py-2 flex items-center gap-3">
        <div className="text-sm font-semibold tracking-wide opacity-90">ai_chatv2</div>
        <div className="ml-auto flex items-center gap-2">
          <button className={chip} onClick={() => openSettings("model")} aria-label="Modell wechseln">
            <span className="opacity-70">Modell:</span> <span className="ml-1 truncate">{modelName}</span>
          </button>
          <button className={chip} onClick={() => openSettings("style")} aria-label="Stil wechseln">
            <span className="opacity-70">Stil:</span> <span className="ml-1 truncate">{styleName}</span>
          </button>
          <button
            className={chip + (memory.enabled ? " border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.12)]" : "")}
            onClick={() => openSettings("memory")}
            aria-label="Gedächtnis"
            title={memory.enabled ? "Gedächtnis aktiv" : "Gedächtnis inaktiv"}
          >
            🧠 <span className="ml-1">{memory.enabled ? "aktiv" : "aus"}</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => openSettings("root")} aria-label="Einstellungen">⚙️</Button>
        </div>
      </div>
    </div>
  );
}
