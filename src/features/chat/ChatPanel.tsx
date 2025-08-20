import * as React from "react";
import { useSession } from "../../entities/session/store";
import ChatInput from "../../components/ChatInput";
import { useSettings } from "../../entities/settings/store";
import { useClient } from "../../lib/client";
import { streamChat, type ChatMsg } from "../../services/chatStream";
import { summarize, shouldSummarize } from "../../services/summarizer";
import { extractAndStoreMemory } from "../../services/memory";
import { selectRelevantMemory, renderMemorySystemBlock } from "../../services/memorySelect";
import { PersonaContext } from "../../entities/persona";

const KEEP_LAST_N = 16;      // Anzahl der jüngsten Nachrichten, die wir im Prompt behalten
const SUMMARY_PREFIX = "Zusammenfassung bisher:"; // Kennzeichner für runningSummary

export default function ChatPanel() {
  const sess = useSession();
  const settings = useSettings();
  const { apiKey } = useClient();
  const persona = React.useContext(PersonaContext);

  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamAcc, setStreamAcc] = React.useState<string | null>(null);
  const [memoryUsed, setMemoryUsed] = React.useState<number>(0);
  const [compressedNotice, setCompressedNotice] = React.useState<string | null>(null);
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
    } as any);
  }

  const currentStyle = React.useMemo(
    () => persona.data.styles.find(s => s.id === settings.personaId) ?? null,
    [persona.data.styles, settings.personaId]
  );

  const onSend = async () => {
    const text = input.trim();
    if (!text || !settings.modelId || !apiKey) return;

    setInput("");
    setMemoryUsed(0);
    setCompressedNotice(null);
    await sess.appendUser(text);

    setStreaming(true);
    setStreamAcc("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // 1) Basis-Historie
    const fullHistory: ChatMsg[] = sess.messages.map((m) => ({ role: m.role, content: m.content }));
    const lastN: ChatMsg[] = fullHistory.slice(-KEEP_LAST_N);
    const pending: ChatMsg[] = [...lastN, { role: "user" as const, content: text }];

    // 2) Running-Summary (falls vorhanden)
    const runningSummary = await sess.getCurrentRunningSummary();
    const runningBlock = runningSummary ? `${SUMMARY_PREFIX}\n${runningSummary}` : null;

    // 3) Memory-Selection (optional)
    let memoryBlock: string | null = null;
    if (settings.autoMemory) {
      const memItems = await selectRelevantMemory(text, 5);
      setMemoryUsed(memItems.length);
      memoryBlock = renderMemorySystemBlock(memItems);
    }

    // 4) System prompt komponieren
    const systemParts: string[] = [];
    if (currentStyle?.system) systemParts.push(currentStyle.system);
    if (memoryBlock) systemParts.push(memoryBlock);
    if (runningBlock) systemParts.push(runningBlock);
    const system = systemParts.length ? systemParts.join("\n\n") : null;

    const runModel = (settings.summarizerModelId ?? settings.modelId)!;

    await streamChat({
      apiKey,
      model: settings.modelId!,
      system,
      messages: pending,
      onToken: (t) => setStreamAcc((prev) => (prev ?? "") + t),
      onDone: async (full) => {
        setStreaming(false);
        setStreamAcc(null);
        await sess.appendAssistant(full);

        // Auto-Summary: wirklich zur runningSummary verdichten + Prune
        try {
          const histForCheck: ChatMsg[] = [
            ...fullHistory,
            { role: "user" as const, content: text },
            { role: "assistant" as const, content: full },
          ];
          if (settings.autoSummarize && shouldSummarize(histForCheck)) {
            const summary = await summarize({ apiKey, model: runModel, history: histForCheck });
            const combined = combineSummaries(runningSummary, summary);
            const id = sess.currentId!;
            await sess.setRunningSummary(id, combined);
            const removed = await sess.pruneMessages(KEEP_LAST_N);
            setCompressedNotice(`Kontext verdichtet (${removed} alte Nachrichten komprimiert).`);
          }

          // Memory-Extraktion im Hintergrund (still)
          if (settings.autoMemory) {
            await extractAndStoreMemory({
              apiKey,
              model: runModel,
              history: histForCheckForMemory(fullHistory, text, full),
            });
          }
        } catch (e) {
          console.warn("summarize/memory failed", e);
        }
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
        {compressedNotice ? (
          <div className="mx-auto text-xs text-white/70 text-center pb-1">{compressedNotice}</div>
        ) : null}
        {view.map((m) => (
          <div key={m.id} className={["max-w-[85%] px-3 py-2 rounded-lg", m.role === "user" ? "ml-auto bg-[hsl(var(--accent-600))] text-black" : "mr-auto bg-white/[0.08] text-white"].join(" ")}>
            <div className="whitespace-pre-wrap text-[15px] leading-normal">{m.content}</div>
          </div>
        ))}
        {streaming ? (
          <div className="mr-auto text-xs text-white/70">
            Antwort wird generiert…{" "}
            <button className="underline" onClick={stop}>Stop</button>
          </div>
        ) : null}
        {!streaming && memoryUsed > 0 ? (
          <div className="mr-auto text-[11px] text-white/60">Memory genutzt: {memoryUsed} Einträge</div>
        ) : null}
      </div>
      <ChatInput value={input} onChange={setInput} onSend={onSend} disabled={streaming || !settings.modelId || !apiKey} />
    </div>
  );
}

/** Kombiniert alte runningSummary mit einer neuen JSON-Summary sinnvoll. */
function combineSummaries(existing: string, s: { bullets: string[]; narrative: string }): string {
  const parts: string[] = [];
  if (existing && existing.trim()) parts.push(existing.trim());
  const bullets = s.bullets?.length ? `• ${s.bullets.join("\n• ")}` : "";
  const narrative = s.narrative?.trim() ?? "";
  const block = [bullets, narrative].filter(Boolean).join("\n\n");
  if (block) parts.push(block);
  return parts.join("\n\n");
}

function histForCheckForMemory(fullHistory: ChatMsg[], user: string, assistant: string): ChatMsg[] {
  return [
    ...fullHistory,
    { role: "user" as const, content: user },
    { role: "assistant" as const, content: assistant },
  ];
}
