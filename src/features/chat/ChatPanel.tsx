import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";

type Bubble = ChatMessage & { id: string; ts: number };

type Props = {
  client: OpenRouterClient;
  modelId: string | "";
  apiKeyPresent: boolean;
  onOpenSettings: () => void;
};

function uuid() {
  if ((globalThis as any)?.crypto?.randomUUID) return (globalThis as any).crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPanel({ client, modelId, apiKeyPresent, onOpenSettings }: Props) {
  const [items, setItems] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const disabledReason = useMemo(() => {
    if (!apiKeyPresent) return "Kein API-Key gesetzt";
    if (!modelId) return "Kein Modell gewählt";
    return "";
  }, [apiKeyPresent, modelId]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const resize = () => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    };
    resize();
    ta.addEventListener("input", resize);
    return () => ta.removeEventListener("input", resize);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 1000;
  }, [items, busy]);

  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const handler = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };
    handler();
    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, []);

  async function send() {
    if (busy || !input.trim()) return;
    if (disabledReason) {
      onOpenSettings();
      return;
    }
    const userMsg: Bubble = { id: uuid(), role: "user", content: input.trim(), ts: Date.now() };
    setInput("");
    setItems(prev => [...prev, userMsg]);
    setBusy(true);

    try {
      const res = await client.chat({
        model: modelId!,
        messages: items.map(({ role, content }) => ({ role, content })).concat([{ role: "user", content: userMsg.content }]),
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

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="chat-root">
      {disabledReason && (
        <div className="notice">
          <span>{disabledReason}</span>
          <button className="btn" onClick={onOpenSettings}>Einstellungen</button>
        </div>
      )}
      <div className="chat-list" ref={listRef} aria-live="polite" aria-label="Chat-Verlauf">
        {items.map(item => (
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
