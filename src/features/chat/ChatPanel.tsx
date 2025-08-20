import * as React from "react";
import { useSession } from "../../entities/session/store";
import ChatInput from "../../components/ChatInput";
import { useSettings } from "../../entities/settings/store";
import { useClient } from "../../lib/client";
import { streamChat, type ChatMsg } from "../../services/chatStream";
import { summarize, shouldSummarize } from "../../services/summarizer";
import { extractAndStoreMemory } from "../../services/memory";
import { PersonaContext } from "../../entities/persona";

export default function ChatPanel() {
  const sess = useSession();
  const settings = useSettings();
  const { apiKey } = useClient();
  const persona = React.useContext(PersonaContext);

  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamAcc, setStreamAcc] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => { void sess.loadInitial(); }, []);

  const messages = sess.messages;
  const view = [...messages];
  if (streamAcc !== null) {
    view.push({
      id: "stream",
      sessionId: sess.currentId ?? "n/a",
      role: "assistant",
      content: streamAcc,
      createdAt: Date.now(),
    });
  }

  const currentStyle = React.useMemo(() => persona.data.styles.find(s => s.id === settings.personaId) ?? null, [persona.data.styles, settings.personaId]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || !settings.modelId || !apiKey) return;

    setInput("");
    await sess.appendUser(text);

    setStreaming(true);
    setStreamAcc("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const baseHistory: ChatMsg[] = sess.messages.map((m) => ({ role: m.role, content: m.content }));
    const history: ChatMsg[] = [...baseHistory, { role: "user", content: text }];

    const runModel = (settings.summarizerModelId ?? settings.modelId)!;

    await streamChat({
      apiKey,
      model: settings.modelId!,
      system: currentStyle?.system ?? null,
      messages: history,
      onToken: (t) => setStreamAcc((prev) => (prev ?? "") + t),
      onDone: async (full) => {
        setStreaming(false);
        setStreamAcc(null);
        await sess.appendAssistant(full);

        try {
          if (settings.autoSummarize && shouldSummarize(history)) {
            const summary = await summarize({ apiKey, model: runModel, history });
            const bullets = summary.bullets.length ? `• ${summary.bullets.join("\n• ")}` : "";
            const narrative = summary.narrative ? `\n\n${summary.narrative}` : "";
            if (bullets || narrative) await sess.appendAssistant(`(Zusammenfassung)\n${bullets}${narrative}`);
          }
        } catch (e) { console.warn("summarize failed", e); }

        try {
          if (settings.autoMemory) {
            await extractAndStoreMemory({ apiKey, model: runModel, history });
          }
        } catch (e) { console.warn("memory extract failed", e); }
      },
      onError: (err) => {
        setStreaming(false);
        setStreamAcc(null);
        void sess.appendAssistant(`[Fehler] ${err.message}`);
      },
      signal: ctrl.signal,
      maxTokensOut: 8000,
    });
  };

  const stop = () => abortRef.current?.abort();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-1 overflow-auto p-3 space-y-2 rounded-xl bg-white/[0.03] border border-white/10 max-h-[65svh]">
        {view.map((m) => (
          <div key={m.id} className={["max-w-[85%] px-3 py-2 rounded-lg", m.role === "user" ? "ml-auto bg-[hsl(var(--accent-600))] text-black" : "mr-auto bg-white/[0.08] text-white"].join(" ")}>
            <div className="whitespace-pre-wrap text-[15px] leading-normal">{m.content}</div>
          </div>
        ))}
        {streaming ? (
          <div className="mr-auto text-xs text-white/70">Antwort wird generiert… <button className="underline" onClick={stop}>Stop</button></div>
        ) : null}
      </div>
      <ChatInput value={input} onChange={setInput} onSend={onSend} disabled={streaming || !settings.modelId || !apiKey} />
    </div>
  );
}
