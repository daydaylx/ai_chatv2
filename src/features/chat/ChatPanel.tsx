import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { PRESETS } from "../../lib/presets";

type Bubble = ChatMessage & { id: string; ts: number };

type Props = {
  client: OpenRouterClient;
  modelId: string | "";
  apiKeyPresent: boolean;
  onOpenSettings: () => void;
  personaId: string;
};

function uuid() {
  if ((globalThis as any)?.crypto?.randomUUID) return (globalThis as any).crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPanel({ client, modelId, apiKeyPresent, onOpenSettings, personaId }: Props) {
  // WICHTIG: Keine System-Bubble mehr im Verlauf ablegen.
  const [items, setItems] = useState<Bubble[]>([]); // enthält NUR user/assistant
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Laufzeit-„System“-Prompt aus aktuellem Stil; wird NUR an die API geschickt, nicht gerendert
  const systemMsg = useMemo<ChatMessage | null>(() => {
    const preset = PRESETS.find(p => p.id === personaId);
    return preset ? { role: "system", content: preset.system } : null;
  }, [personaId]);

  const disabledReason = useMemo(() => {
    if (!apiKeyPresent) return "Kein API-Key gesetzt";
    if (!modelId) return "Kein Modell gewählt";
    return "";
  }, [apiKeyPresent, modelId]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const resize = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; };
    resize();
    ta.addEventListener("input", resize);
    return () => ta.removeEventListener("input", resize);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 1000;
  }, [items, busy]);

  async function send() {
    if (busy || !input.trim()) return;
    if (disabledReason) { onOpenSettings(); return; }

    const trimmed = input.trim();
    const userMsg: Bubble = { id: uuid(), role: "user", content: trimmed, ts: Date.now() };

    // Snapshot der bisherigen History (ohne system), dann UI sofort updaten
    const historySnapshot = items;
    setInput("");
    setItems(prev => [...prev, userMsg]);
    setBusy(true);

    try {
      // Nur hier den System-Prompt voranstellen – NICHT rendern
      const historyMsgs = historySnapshot.map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const baseMsgs = systemMsg ? [systemMsg, ...historyMsgs] : historyMsgs;

      const res = await client.chat({
        model: modelId!,
        messages: [...baseMsgs, { role: "user", content: userMsg.content }],
        temperature: 0.7,
        max_tokens: 1024
      });

      const botMsg: Bubble = { id: uuid(), role: "assistant", content: res.content, ts: Date.now() };
      setItems(prev => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Bubble = { id: uuid(), role: "assistant", content: `❌ ${e?.message ?? e}`, ts: Date.now() };
      setItems(prev => [...prev, errMsg]);
    } finally {
      setBusy(false);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }

  function handleKey(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Nur user/assistant rendern; falls Altzustände "system" enthalten, werden sie unterdrückt
  const renderItems = items.filter(m => m.role !== "system");

  return (
    <div className="chat-root">
      {disabledReason && (
        <div className="notice">
          <span>{disabledReason}</span>
          <button className="btn" onClick={onOpenSettings}>Einstellungen</button>
        </div>
      )}

      <div className="chat-list" ref={listRef} aria-live="polite" aria-label="Chat-Verlauf">
        {renderItems.map(item => (
          <div key={item.id} className={`bubble ${item.role === "user" ? "bubble--user" : "bubble--bot"}`}>
            <div className="bubble__txt">{item.content}</div>
            <div className={`bubble__meta ${item.role === "user" ? "meta--r" : "meta--l"}`}>
              {new Date(item.ts).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {busy && (
          <div className="bubble bubble--bot">
            <div className="bubble__dots" aria-label="Antwort wird erzeugt">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="composer" role="group" aria-label="Nachricht schreiben">
        <textarea
          ref={taRef}
          rows={1}
          className="composer__input"
          placeholder="Nachricht schreiben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={!!disabledReason || busy}
          inputMode="text"
        />
        <button className="btn btn--send" onClick={send} disabled={!!disabledReason || busy || !input.trim()} aria-label="Senden">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21l21-9L2 3l5 8-5 10zm5-10 13-1L7 11Zm0 0 13 1L7 11Z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  );
}
