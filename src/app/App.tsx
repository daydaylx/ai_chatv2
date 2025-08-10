export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
import { useEffect, useMemo, useRef, useState } from "react";
import InputBar from "../features/chat/InputBar";
import { ErrorBoundary } from "./ErrorBoundary";
import { OpenRouterClient } from "../lib/openrouter";
import { getApiKey, setApiKey, clearApiKey } from "../lib/storage";
import { getCurrentSession, getMessages as dbGetMessages, addMessage as dbAddMessage, upsertAssistantMessage } from "../lib/db";
import ModelPicker from "../features/models/ModelPicker";
import Backup from "../features/settings/Backup";
import PersonaPicker from "../features/settings/PersonaPicker";
import { getDefaultPreset, getPresetById, setPresetId, type PersonaPreset } from "../lib/presets";
import SwUpdate from "./SwUpdate";
import { mountKeyboardSafeArea } from "../lib/keyboard";
import { applyTheme, getTheme, setTheme, type ThemeId } from "../lib/theme";
import ThemePicker from "../features/settings/ThemePicker";
import ScrollToBottom from "./ScrollToBottom";
import "../styles/mobile.css";

type Msg = ChatMessage & { id: string };

const FALLBACK_MODEL = (localStorage.getItem("model") || "openai/o4-mini").trim();

export default function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [model, setModel] = useState(FALLBACK_MODEL);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModels, setShowModels] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showPersona, setShowPersona] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [persona, setPersona] = useState<PersonaPreset>(() => getDefaultPreset());
  const [themeId, setThemeId] = useState<ThemeId>(() => getTheme().id);

  const apiKey = getApiKey();

  useEffect(() => {
    applyTheme();
    const off = mountKeyboardSafeArea();
    function syncOnline() { setOnline(navigator.onLine); }
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      off();
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const s = await getCurrentSession();
      setSessionId(s.id);
      const msgs = await dbGetMessages(s.id);
      setMessages(msgs.map(m => ({ id: m.id, role: m.role, content: m.content })));
    })();
  }, []);

  const client = useMemo(() => {
    if (!apiKey) return null;
    try { return new OpenRouterClient({ apiKey, timeoutMs: 45000, maxRetries: 2 }); }
    catch { return null; }
  }, [apiKey]);

  async function send(text: string) {
    setError(null);
    if (!apiKey) { setError("API-Key fehlt. Tippe oben auf „Key setzen“."); return; }
    if (!client) { setError("Client nicht bereit."); return; }
    if (!online) { setError("Offline. Senden nicht möglich."); return; }
    if (!sessionId) { setError("Session nicht geladen."); return; }

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user" as const, content: text };
    setMessages(m => [...m, userMsg]);
    await dbAddMessage({ id: userMsg.id, sessionId, role: "user" as const, content: text, createdAt: Date.now() });

    const base: ChatMessage[] = [
      { role: "system" as const, content: persona.system },
      ...messages,
      userMsg
    ].map(({ role, content }) => ({ role, content }));

    setStreaming(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const assistantRef: { id?: string } = {};
    try {
      let acc = "";
      for await (const chunk of client.chatStream({ model, messages: base, stream: true }, ac.signal)) {
        acc += chunk;
        setMessages(m => {
          const last = m[m.length - 1];
          if (last?.role === "assistant") {
            const copy = [...m];
            copy[copy.length - 1] = { ...last, content: acc };
            return copy;
          }
          return [...m, { id: assistantRef.id || "pending", role: "assistant" as const, content: acc }];
        });
        await upsertAssistantMessage(sessionId, assistantRef, acc);
      }
    } catch (e) {
      setError((e as Error)?.message || String(e));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function abort() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  function handleSetKey() {
    const v = prompt("OpenRouter API-Key eingeben (wird lokal gespeichert):", "");
    if (v && v.trim()) {
      setApiKey(v.trim());
      location.reload();
    }
  }

  function handleClearKey() {
    if (confirm("API-Key lokal löschen?")) {
      clearApiKey();
      location.reload();
    }
  }

  function setPersonaById(id: PersonaPreset["id"]) {
    const p = getPresetById(id);
    if (p) {
      setPersona(p);
      setPresetId(p.id);
    }
  }

  function setThemeById(id: ThemeId) {
    setTheme(id);
    setThemeId(id);
  }

  return (
    <div className="app">
      <SwUpdate />
      <header className="topbar">
        <div className="topbar__left brand">
          <strong>AI Chat</strong>
        </div>
        <div className="topbar__right">
          <button className="keybtn" onClick={() => setShowModels(true)} aria-label="Modelle">Modelle</button>
          <button className="keybtn" onClick={() => setShowPersona(true)} aria-label="Stil wählen">
            Stil: {persona.label}
          </button>
          <button className="keybtn" onClick={() => setShowTheme(true)} aria-label="Theme">Theme</button>
          <button className="keybtn" onClick={() => setShowBackup(true)} aria-label="Backup">Backup</button>
          {!apiKey ? (
            <button className="keybtn" onClick={handleSetKey}>Key setzen</button>
          ) : (
            <button className="keybtn danger" onClick={handleClearKey}>Key löschen</button>
          )}
        </div>
      </header>

      {!online && <div className="banner warn">Offline – Chatten erst wieder online möglich.</div>}
      {error && <div className="banner error">{error}</div>}

      <main className="chat">
        {messages.length === 0 && (
          <div className="empty">
            <p>Willkommen. Gib unten deine Nachricht ein.</p>
            <p className="hint">Tipp: <em>Ctrl/⌘+Enter</em> sendet.</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            <div className={`msg__bubble ${m.role === "assistant" ? "msg__bubble--assistant" : ""}`}>{m.content}</div>
          </div>
        ))}
        <div style={{ height: 96 }} />
      </main>

      <ScrollToBottom />

      <footer className="bottombar">
        <InputBar disabled={!apiKey} isStreaming={streaming} onSend={send} onAbort={abort} />
      </footer>

      {client && (
        <ModelPicker
          visible={showModels}
          onClose={() => setShowModels(false)}
          onChange={(id) => setModel(id)}
          client={client}
        />
      )}

      <PersonaPicker
        visible={showPersona}
        currentId={persona.id}
        onChange={setPersonaById}
        onClose={() => setShowPersona(false)}
      />

      <ThemePicker
        visible={showTheme}
        value={themeId}
        onChange={setThemeById}
        onClose={() => setShowTheme(false)}
      />

      <Backup visible={showBackup} onClose={() => setShowBackup(false)} />
    </div>
  );
}
