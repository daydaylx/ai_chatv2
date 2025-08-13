import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import SettingsDrawer from "./features/settings/SettingsDrawer";
import ChatPanel from "./features/chat/ChatPanel";
import PersonaPicker from "./features/settings/PersonaPicker";
import { OpenRouterClient } from "./lib/openrouter";
import { PRESETS } from "./lib/presets";

const LS_MODEL = "model_id";
const LS_PERSONA = "persona_id";

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [modelId, setModelId] = useState<string>(() => localStorage.getItem(LS_MODEL) || "");
  const [personaId, setPersonaId] = useState<string>(() => localStorage.getItem(LS_PERSONA) || "neutral");
  const [apiKeyPresent, setApiKeyPresent] = useState<boolean>(() => !!client.getApiKey());

  useEffect(() => { localStorage.setItem(LS_MODEL, modelId || ""); }, [modelId]);
  useEffect(() => { localStorage.setItem(LS_PERSONA, personaId || ""); }, [personaId]);

  const currentPreset = PRESETS.find(p => p.id === personaId);
  const personaLabel = currentPreset ? currentPreset.label : undefined;

  return (
    <div className="m-app">
      <Header
        title="AI Chat"
        keySet={apiKeyPresent}
        modelLabel={modelId || undefined}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="m-main">
        <ChatPanel
          key={personaId}
          client={client}
          modelId={modelId}
          apiKeyPresent={apiKeyPresent}
          onOpenSettings={() => setSettingsOpen(true)}
          personaId={personaId}
        />
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        client={client}
        modelId={modelId}
        onModelChange={setModelId}
        onKeyChanged={() => setApiKeyPresent(!!client.getApiKey())}
        personaLabel={personaLabel}
        onOpenPersona={() => { setSettingsOpen(false); setPersonaOpen(true); }}
        personaId={personaId}
      />

      {personaOpen && (
        <PersonaPicker
          visible={personaOpen}
          currentId={personaId}
          onPick={(id) => setPersonaId(id)}
          onClose={() => setPersonaOpen(false)}
        />
      )}
    </div>
  );
}
