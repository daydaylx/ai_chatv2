import React from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { useClient } from "../../lib/client";
import { MessageBubble } from "../../components/MessageBubble";
import { ChatInput } from "../../components/ChatInput";
import { useToast } from "../../shared/ui/Toast";
import { SettingsContext } from "../../widgets/shell/AppShell";
import { ScrollToEnd } from "../../components/ScrollToEnd";
import { ruleForStyle, isModelAllowed } from "../../config/styleModelRules";
import { useMemory } from "../../entities/memory/store";
import { injectMemory } from "../../lib/memoryPipeline";
import { extractFromChat } from "../memory/extract";

type Bubble = ChatMessage & { id: string; ts: number };
const uuid = () => (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export default function ChatPanel() {
  const [items, setItems] = React.useState<Bubble[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const abortRef = React.useRef<AbortController|null>(null);
  const listRef = React.useRef<HTMLDivElement|null>(null);

  const settings = useSettings();
  const persona = React.useContext(PersonaContext);
  const { client, getSystemFor } = useClient();
  const toast = useToast();
  const openSettings = React.useContext(SettingsContext);
  const memory = useMemory();

  const currentStyle = React.useMemo(
    () => persona.data.styles.find(x => x.id === (settings.personaId ?? "")) ?? null,
    [persona.data.styles, settings.personaId]
  );
  const systemMsg = React.useMemo(() => getSystemFor(currentStyle ?? null), [currentStyle, getSystemFor]);

  React.useEffect(() => { scrollToEnd(); }, [items.length]);

  function scrollToEnd() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 9999;
  }

  async function send() {
    if (busy) { try { abortRef.current?.abort(); } catch {} return; }

    const content = input.trim();
    if (!content) return;

    if (!settings.modelId) {
      toast.show("Wähle zuerst ein Modell.", "error");
      openSettings("model");
      return;
    }
    if (!systemMsg) {
      toast.show("Wähle zuerst einen Stil.", "error");
      openSettings("style");
      return;
    }

    // Stil→Modell-Regel (ID + Name)
    const rule = ruleForStyle(settings.personaId ?? null, currentStyle?.name ?? null);
    if (rule) {
      const ok = isModelAllowed(rule, settings.modelId, null);
      if (!ok) {
        const brief = [
          ...(rule.allowedIds ?? []),
          ...(rule.allowedPatterns ?? []).map(p => `/${p}/`)
        ].slice(0, 6).join(", ");
        toast.show(`Stil erfordert bestimmte Modelle. Erlaubt: ${brief || "siehe Liste"}`, "error");
        openSettings("model");
        return;
      }
    }

    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const user: Bubble = { id: uuid(), role: "user", content, ts: Date.now() };
    const asst: Bubble = { id: uuid(), role: "assistant", content: "", ts: Date.now() };
    setItems(prev => [...prev, user, asst]);
    setInput("");

    let accum = "";

    try {
      // Basismessages: Stil + History + aktuelle User-Nachricht
      const base: ChatMessage[] = [
        systemMsg,
        ...items.map(({role, content}) => ({role, content})),
        { role: "user", content }
      ];

      // Dev-Guard: Stil 1:1
      if (import.meta.env?.DEV) {
        const chosen = currentStyle?.system ?? "";
        const sys = base[0]?.content ?? "";
        if (chosen !== sys) console.warn("[guard] System-Prompt weicht ab (nicht 1:1)");
      }

      // Memory injizieren (als 2. System-Nachricht) + Budget grob kürzen
      const messages = injectMemory(base, { enabled: memory.enabled, autoExtract: memory.autoExtract, entries: memory.entries }, { maxChars: 12000 });

      await client.send({
        model: settings.modelId!,
        messages,
        signal: ac.signal,
        onToken: (delta) => {
          accum += delta;
          setItems(prev => prev.map((b) => b.id === asst.id ? ({ ...b, content: accum }) : b));
        }
      });

      // Nach dem Turn: Auto-Extraktion aus Chatturn
      if (memory.enabled && memory.autoExtract) {
        const candidates = extractFromChat(content, accum);
        if (candidates.length) {
          for (const c of candidates) memory.add(c.text, c.tags, { ttlDays: c.ttlDays ?? 90, confidence: c.confidence ?? 0.75 });
          toast.show(`🧠 ${candidates.length} Kontextpunkt(e) gespeichert.`, "info");
        }
      }

      // Memory "gesehen"
      if (memory.enabled && memory.entries.length) {
        memory.touchAll();
      }

    } catch (e: any) {
      const msg = String(e?.name || "").toLowerCase() === "aborterror"
        ? "⏹️ abgebrochen"
        : `❌ ${String(e?.message ?? e)}`;
      setItems(prev => prev.map(b => b.id === asst.id ? ({ ...b, content: (b.content || msg) }) : b));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const lastAssistantId = React.useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      const m = items[i];
      if (m && m.role === "assistant") return m.id;
    }
    return null;
  }, [items]);

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-auto px-3 py-4 space-y-3 overscroll-contain">
        {items.length === 0 && (
          <div className="mx-auto mt-16 max-w-md text-center opacity-70">
            <div className="text-sm">Starte, indem du <b>API-Key</b>, <b>Modell</b> und <b>Stil</b> wählst.</div>
            <div className="text-xs mt-2">Der Stil wird als unveränderte System-Nachricht gesendet.</div>
          </div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="flex"
            role="listitem"
            {...(it.id === lastAssistantId ? { "aria-live": "polite" as const, "aria-atomic": true } : {})}
          >
            <MessageBubble role={it.role}>{it.content || " "}</MessageBubble>
          </div>
        ))}
      </div>

      <ScrollToEnd target={listRef} />
      <ChatInput value={input} onChange={setInput} onSend={send} busy={busy} />
    </div>
  );
}
