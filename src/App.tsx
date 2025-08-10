import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import SettingsDrawer from "./features/settings/SettingsDrawer";
import ChatPanel from "./features/chat/ChatPanel";
import { OpenRouterClient } from "./lib/openrouter";

const LS_MODEL = "model_id";

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelId, setModelId] = useState<string>(() => localStorage.getItem(LS_MODEL) || "");
  const [apiKeyPresent, setApiKeyPresent] = useState<boolean>(() => !!client.getApiKey());

  useEffect(() => {
    localStorage.setItem(LS_MODEL, modelId || "");
  }, [modelId]);

  function onOpenSettings() {
    setSettingsOpen(true);
  }

  function onKeyChanged() {
    setApiKeyPresent(!!client.getApiKey());
  }

  return (
    <div className="m-app">
      <Header
        title="AI Chat"
        keySet={apiKeyPresent}
        modelLabel={modelId || undefined}
        onOpenSettings={onOpenSettings}
      />

      <main className="m-main">
        <ChatPanel
          client={client}
          modelId={modelId}
          apiKeyPresent={apiKeyPresent}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        client={client}
        modelId={modelId}
        onModelChange={setModelId}
        onKeyChanged={onKeyChanged}
      />
    </div>
  );
}
