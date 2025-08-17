import React, { useContext, useMemo, useRef, useState } from "react";
import { useSettings } from "../../entities/settings/store";
import { OpenRouterClient, type OpenRouterChatMessage } from "../../lib/openrouter";
import { ensureSummary } from "../../lib/summary";
import { buildPrompt } from "../../lib/context";
import { PersonaContext } from "../../entities/persona";

type Msg = { id: string; role: "user"|"assistant"|"system"; content: string; at: number };

function uid() { return Math.random().toString(36).slice(2); }

export default function ChatPanel() {
  const settings = useSettings() as any;
  const { data } = useContext(PersonaContext);
  const apiKey = settings?.apiKey || null;
  const modelId = settings?.modelId || "deepseek/deepseek-r1:free";
  const baseSystem = "Kurz, neutral.";
  const activeStyle = useMemo(() => data.styles.find(st => st.id === (settings?.styleId || "neutral")) || { id: "neutral", name: "Sachlich", system: "Kurz, präzise, Deutsch." }, [data.styles, settings?.styleId]);
  const styleSystem = activeStyle.system;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const client = useMemo(() => new OpenRouterClient(apiKey), [apiKey]);
  const chatKey = "default";

  async function handleSend() {
    const userText = input.trim();
    if (!userText || streaming) return;

    const userMsg: Msg = { id: uid(), role: "user", content: userText, at: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");

    const fullHistory = next.map(m => ({ role: m.role, content: m.content })) as OpenRouterChatMessage[];
    const userTurnCount = next.filter(m => m.role === "user").length;
    const { summary } = await ensureSummary({ chatKey, modelId, fullHistory, userTurnCount });

    const { messages: prompt } = await buildPrompt({ modelId, baseSystem, styleSystem, fullHistory, summary });

    const assistantId = uid();
    setMessages(m => [...m, { id: assistantId, role: "assistant", content: "", at: Date.now() }]);

    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);

    try {
      let acc = "";
      for await (const delta of client.streamChat({ model: modelId, messages: prompt, signal: ac.signal })) {
        acc += delta;
        setMessages(m => m.map(x => x.id === assistantId ? { ...x, content: acc } : x));
      }
    } catch (e: any) {
      const msg =
        e?.message === "NO_API_KEY" ? "Fehler: Kein API-Key gesetzt." :
        e?.message === "AUTH" ? "Fehler: 401 – API-Key prüfen." :
        e?.message === "RATE" ? "Rate-Limit – später erneut senden." :
        e?.name === "AbortError" ? "Abgebrochen." : "Netzwerkfehler.";
      setMessages(m => m.map(x => x.id === assistantId ? { ...x, content: `[${msg}]` } : x));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={(m.role === "user" ? "bg-[var(--bubble-user)]" : "bg-[var(--bubble-ai)]") + " inline-block px-3 py-2 rounded-2xl whitespace-pre-wrap"}>
              {m.content || (m.role === "assistant" ? "…" : null)}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            rows={1}
            placeholder="Schreiben… (Enter=Send, Shift+Enter=Zeile)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
            }}
          />
          {!streaming ? (
            <button className="px-3 py-2 rounded-xl bg-[var(--accent)] text-black font-medium" onClick={() => void handleSend()}>Senden</button>
          ) : (
            <button className="px-3 py-2 rounded-xl bg-red-500 text-white font-medium" onClick={handleStop}>Stop</button>
          )}
        </div>
      </div>
    </div>
  );
}
