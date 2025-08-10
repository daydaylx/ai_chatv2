import { useEffect, useRef, useState } from "react";
import "./styles/global.css";
import Settings from "@/components/Settings";
import { OpenRouterClient, ChatMessage } from "@/lib/openrouter";

type Msg = { id: string; role: "user" | "ai"; content: string };

function copyText(text: string) {
  try { navigator.clipboard.writeText(text); } catch {}
}

export default function App() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: crypto.randomUUID(), role: "ai", content: "Willkommen! API-Key setzen (⚙️) → Modell wählen → chatten." }
  ]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !apiKey || !model || isStreaming) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");

    const aiId = crypto.randomUUID();
    setMsgs(prev => [...prev, { id: aiId, role: "ai", content: "" }]);

    const client = new OpenRouterClient(apiKey, 30000, 2);
    const messages: ChatMessage[] = [
      ...msgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
      { role: "user", content: text }
    ];
    const req = { model, messages, stream: true };

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsStreaming(true);

    try {
      let acc = "";
      for await (const delta of client.chatStream(req, ctrl.signal)) {
        acc += delta;
        const chunk = acc;
        setMsgs(prev => prev.map(m => (m.id === aiId ? { ...m, content: chunk } : m)));
      }
    } catch (e: any) {
      const err = e?.name === "AbortError" ? "⏹️ abgebrochen" : `⚠️ Fehler: ${e?.message ?? "unbekannt"}`;
      setMsgs(prev => prev.map(m => (m.id === aiId ? { ...m, content: err } : m)));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="app">
      <div className="header">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
          <span>AI Chat · Mobile PWA</span>
          <span className="small" style={{ marginLeft: 8, opacity: 0.8 }}>
            {model ? `· ${model}` : "· kein Modell gewählt"}
          </span>
        </div>
        <button className="btn" onClick={() => setSettingsOpen(true)} aria-label="Einstellungen">⚙️</button>
      </div>

      <div className="chat" ref={scrollerRef} aria-live="polite">
        {msgs.map(m => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div>{m.content}</div>
            {m.role === "ai" && m.content && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button className="btn" onClick={() => copyText(m.content)} aria-label="Antwort kopieren">Kopieren</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="composer">
        <div className="composer-inner">
          <textarea
            aria-label="Nachricht"
            placeholder={apiKey ? "Nachricht eingeben…" : "API-Key in den Einstellungen setzen…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={!apiKey || !model || isStreaming}
          />
          {!isStreaming && <button className="btn" onClick={send} disabled={!apiKey || !model}>Senden</button>}
          {isStreaming && <button className="btn" onClick={stop}>Stop</button>}
        </div>
        <div className="small" style={{padding: "6px 4px 0"}}>
          Enter: senden · Shift+Enter: Zeilenumbruch
        </div>
      </div>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        model={model}
        setModel={setModel}
      />
    </div>
  );
}
