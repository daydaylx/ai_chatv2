import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import SettingsDrawer from "@/features/settings/SettingsDrawer";
import ChatPanel from "@/features/chat/ChatPanel";
import ChatSheet from "@/features/chats/ChatSheet";
import { OpenRouterClient } from "@/lib/openrouter";
import { useChatStore } from "@/entities/chat/store";

const LS_MODEL = "model_id";
const LS_THEME = "theme";

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);

  const [modelId, setModelId] = useState<string>(() => localStorage.getItem(LS_MODEL) || "");
  const [apiKeyPresent, setApiKeyPresent] = useState<boolean>(() => !!client.getApiKey());
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem(LS_THEME) as "dark" | "light") || "dark"
  );

  const currentChat = useChatStore((s) => s.currentChat());
  const setCurrentChat = useChatStore((s) => s.setCurrentChat);
  const chats = useChatStore((s) => s.chats);

  // ensure a current chat exists
  useEffect(() => {
    if (!currentChat && chats[0]) setCurrentChat(chats[0].id);
  }, [currentChat, chats, setCurrentChat]);

  useEffect(() => {
    localStorage.setItem(LS_MODEL, modelId || "");
  }, [modelId]);

  useEffect(() => {
    localStorage.setItem(LS_THEME, theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <div className="flex min-h-0 h-[100dvh] flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      <Header
        title="Disa AI"
        keySet={apiKeyPresent}
        modelLabel={modelId || undefined}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenChats={() => setChatsOpen(true)}
      />

      {/* WICHTIG: min-h-0 + overflow-hidden, damit das Kind (ChatPanel) scrollen darf */}
      <main className="relative flex-1 min-h-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <ChatPanel
          client={client}
          modelId={modelId}
          apiKeyPresent={apiKeyPresent}
          onOpenSettings={() => setSettingsOpen(true)}
          systemPrompt={undefined}
        />
      </main>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsDrawer
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            client={client}
            modelId={modelId}
            onModelChange={setModelId}
            onKeyChanged={() => setApiKeyPresent(!!client.getApiKey())}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatsOpen && <ChatSheet open={chatsOpen} onClose={() => setChatsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
