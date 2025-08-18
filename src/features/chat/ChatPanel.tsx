import React from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { useClient } from "../../lib/client";
import { MessageBubble } from "../../components/MessageBubble";
import { ChatInput } from "../../components/ChatInput";
import { useToast } from "../../shared/ui/Toast";
import { SettingsContext } from "../../widgets/shell/AppShell";

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

  const currentStyle = React.useMemo(()=> persona.data.styles.find(x => x.id === (settings.personaId ?? "")) ?? null, [persona.data.styles, settings.personaId]);
  const systemMsg = React.useMemo(()=> getSystemFor(currentStyle ?? null), [currentStyle, getSystemFor]);

  React.useEffect(() => { scrollToEnd(); }, [items.length]);

  function scrollToEnd() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 9999;
  }

  async function send() {
    const content = input.trim();
    if (!content || busy) return;

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

    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const user: Bubble = { id: uuid(), role: "user", content, ts: Date.now() };
    const asst: Bubble = { id: uuid(), role: "assistant", content: "", ts: Date.now() };
    setItems(prev => [...prev, user, asst]);
    setInput("");

    try {
      const messages: ChatMessage[] = [systemMsg, ...items.map(({role, content}) => ({role, content})), { role: "user", content }];

      if (import.meta.env?.DEV) {
        const chosen = currentStyle?.system ?? "";
        const sys = messages[0]?.content ?? "";
        if (chosen !== sys) console.warn("[guard] System-Prompt weicht ab (nicht 1:1)");
      }

      let accum = "";
      await client.send({
        model: settings.modelId!,
        messages,
        signal: ac.signal,
        onToken: (delta) => {
          accum += delta;
          setItems(prev => prev.map((b) => b.id === asst.id ? ({ ...b, content: accum }) : b));
        }
      });

    } catch (e: any) {
      setItems(prev => prev.map(b => b.id === asst.id ? ({ ...b, content: `❌ ${String(e?.message ?? e)}` }) : b));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function stop() {
    try { abortRef.current?.abort(); } catch {}
  }

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
          <div key={it.id} className="flex" role="listitem">
            <MessageBubble role={it.role}>{it.content || " "}</MessageBubble>
          </div>
        ))}
      </div>

      <ChatInput value={input} onChange={setInput} onSend={busy ? stop : send} busy={busy} />
    </div>
  );
}
