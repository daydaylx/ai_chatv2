import { useEffect, useMemo, useRef, useState } from "react";
import InputBar from "../features/chat/InputBar";
import { ErrorBoundary } from "./ErrorBoundary";
import { OpenRouterClient, type ChatMessage } from "../lib/openrouter";
import { getApiKey, setApiKey, clearApiKey } from "../lib/storage";
import { getCurrentSession, getMessages as dbGetMessages, addMessage as dbAddMessage, upsertAssistantMessage } from "../lib/db";
import ModelPicker from "../features/models/ModelPicker";
import Backup from "../features/settings/Backup";
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

  const abortRef = useRef<AbortController | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const apiKey = getApiKey();

  useEffect(() => {
    function syncOnline() { setOnline(navigator.onLine); }
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => { localStorage.setItem("model", model); }, [model]);

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
    try { return new OpenRouterClient(apiKey, { timeoutMs: 45000, maxRetries: 2 }); }
    catch { return null; }
  }, [apiKey]);

  async function send(text: string) {
    setError(null);
    if (!apiKey) { setError("API-Key fehlt. Tippe oben auf „Key setzen“."); return; }
    if (!client) { setError("Client nicht bereit."); return; }
    if (!online) { setError("Offline. Senden nicht möglich."); return; }
    if (!sessionId) { setError("Session nicht geladen."); return; }

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(m => [...m, userMsg]);

    await dbAddMessage({ id: userMsg.id, sessionId, role: "user", content: text, createdAt: Date.now() });

    const base: ChatMessage[] = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    setStreaming(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const assistantRef: { id?: string } = {};
    try {
      let acc = "";
      for await (const chunk of client.chatStream({ model, messages: base, stream: true }, ac.signal)) {
        acc += chunk;
        // UI
        setMessages(m => {
          const last = m[m.length - 1];
          if (last?.role === "assistant") {
            const copy = [...m];
            copy[copy.length - 1] = { ...last, content: acc };
            return copy;
          }
          return [...m, { id: assistantRef.id || "pending", role: "assistant", content: acc }];
        });
        // DB
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

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__left">
          <strong>AI Chat</strong>
        </div>
        <div className="topbar__right">
          <button className="keybtn" onClick={() => setShowModels(true)}>Modelle</button>
          <button className="keybtn" onClick={() => setShowBackup(true)}>Backup</button>
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
            <div className="msg__bubble">{m.content}</div>
          </div>
        ))}
        <div style={{ height: 96 }} />
      </main>

      <footer className="bottombar">
        <InputBar disabled={!apiKey} isStreaming={streaming} onSend={send} onAbort={abort} />
      </footer>

      {client && (
        <ModelPicker
          visible={showModels}
          onClose={() => setShowModels(false)}
          onPick={(id) => setModel(id)}
          client={client}
        />
      )}

      <Backup visible={showBackup} onClose={() => setShowBackup(false)} />
    </div>
  );
}
