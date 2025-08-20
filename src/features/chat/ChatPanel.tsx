// src/features/chat/ChatPanel.tsx
import React from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { useClient } from "../../lib/client";
import { MessageBubble } from "../../components/MessageBubble";
import { ChatInput } from "../../components/ChatInput";
import { useToast } from "../../shared/ui/Toast";
import { SettingsContext } from "../../widgets/shell/AppShell";
import { ruleForStyle, isModelAllowed } from "../../config/styleModelRules";
import { useMemory } from "../../entities/memory/store";
import { injectMemory } from "../../lib/memoryPipeline";

type Bubble = ChatMessage & { id: string; ts: number };

function makeUuid(): string {
  const anyCrypto = (crypto as any);
  if (anyCrypto && typeof anyCrypto.randomUUID === "function") {
    return anyCrypto.randomUUID();
  }
  return Date.now().toString() + "-" + Math.random().toString(36).slice(2, 8);
}

export default function ChatPanel() {
  const [items, setItems] = React.useState<Bubble[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  // Scroll-Setup
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const tailRef = React.useRef<HTMLDivElement | null>(null);
  const shouldStickRef = React.useRef<boolean>(true); // true = am Ende kleben

  const settings = useSettings();
  const persona = React.useContext(PersonaContext);
  const { client, getSystemFor } = useClient();
  const toast = useToast();
  const openSettings = React.useContext(SettingsContext);
  const memory = useMemory();

  const currentStyle = React.useMemo(() => {
    const id = settings.personaId ?? "";
    return persona.data.styles.find((x) => x.id === id) ?? null;
  }, [persona.data.styles, settings.personaId]);

  const systemMsg = React.useMemo(() => {
    return getSystemFor(currentStyle ?? null);
  }, [currentStyle, getSystemFor]);

  // Scroll-Listener: aktualisiert shouldStickRef
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function computeStick(): void {
      shouldStickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
    }

    function onScroll(): void {
      computeStick();
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    computeStick();

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          if (shouldStickRef.current) {
            requestAnimationFrame(() => {
              if (tailRef.current) tailRef.current.scrollIntoView({ block: "end" });
            });
          }
        })
      : null;

    if (ro) ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (ro) ro.disconnect();
    };
  }, []);

  // Neue Nachrichten: nur autoscrollen, wenn shouldStickRef true
  React.useEffect(() => {
    if (!shouldStickRef.current) return;
    requestAnimationFrame(() => {
      if (tailRef.current) tailRef.current.scrollIntoView({ block: "end" });
    });
  }, [items.length]);

  async function send(): Promise<void> {
    if (busy) {
      try {
        if (abortRef.current) abortRef.current.abort();
      } catch {
        // ignore
      }
      return;
    }

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
    const rule = ruleForStyle(settings.personaId ?? null, currentStyle ? currentStyle.name : null);
    if (rule) {
      const ok = isModelAllowed(rule, settings.modelId, null);
      if (!ok) {
        const parts: string[] = [];
        if (rule.allowedIds && rule.allowedIds.length) {
          for (let i = 0; i < rule.allowedIds.length && parts.length < 6; i++) {
            parts.push(rule.allowedIds[i]);
          }
        }
        if (rule.allowedPatterns && rule.allowedPatterns.length) {
          for (let i = 0; i < rule.allowedPatterns.length && parts.length < 6; i++) {
            parts.push("/" + rule.allowedPatterns[i] + "/");
          }
        }
        const brief = parts.join(", ");
        toast.show("Stil erfordert bestimmte Modelle. Erlaubt: " + (brief || "siehe Liste"), "error");
        openSettings("model");
        return;
      }
    }

    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;

    // Beim Senden: ans Ende pinnen
    shouldStickRef.current = true;

    const user: Bubble = { id: makeUuid(), role: "user", content, ts: Date.now() };
    const asst: Bubble = { id: makeUuid(), role: "assistant", content: "", ts: Date.now() };
    setItems((prev) => prev.concat(user, asst));
    setInput("");

    try {
      // Basis-Verlauf (Stil + History + aktuelle User-Nachricht)
      const history: ChatMessage[] = items.map(function (it) {
        return { role: it.role, content: it.content };
      });

      const base: ChatMessage[] = [systemMsg].concat(history).concat([{ role: "user", content }]);

      // Dev-Guard: Stil 1:1
      if (import.meta.env && (import.meta.env as any).DEV) {
        const chosen = currentStyle && currentStyle.system ? currentStyle.system : "";
        const sys = base.length > 0 && base[0] && typeof base[0].content === "string" ? (base[0].content as string) : "";
        if (chosen !== sys) {
          // eslint-disable-next-line no-console
          console.warn("[guard] System-Prompt weicht ab (nicht 1:1)");
        }
      }

      // Memory als 2. System-Nachricht injizieren + Budget grob kürzen
      const messages = injectMemory(
        base,
        { enabled: memory.enabled, autoExtract: memory.autoExtract, entries: memory.entries } as any,
        { maxChars: 12000 }
      );

      let accum = "";
      await client.send({
        model: settings.modelId as string,
        messages,
        signal: ac.signal,
        onToken: (delta: string) => {
          accum += delta;
          setItems((prev) =>
            prev.map((b) => (b.id === asst.id ? { ...b, content: accum } : b))
          );
          if (shouldStickRef.current) {
            requestAnimationFrame(() => {
              if (tailRef.current) tailRef.current.scrollIntoView({ block: "end" });
            });
          }
        }
      });

      // Memory "gesehen"
      if (memory.enabled && memory.entries.length) {
        memory.touchAll();
      }
    } catch (e: any) {
      const isAbort = String(e && e.name ? e.name : "").toLowerCase() === "aborterror";
      const msg = isAbort ? "⏹️ abgebrochen" : "❌ " + String(e && e.message ? e.message : e);
      setItems((prev) =>
        prev.map((b) => (b.id === asst.id ? { ...b, content: b.content || msg } : b))
      );
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
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-auto px-3 py-4 space-y-3 overscroll-contain"
      >
        {items.length === 0 && (
          <div className="mx-auto mt-16 max-w-md text-center opacity-70">
            <div className="text-sm">
              Starte, indem du <b>API-Key</b>, <b>Modell</b> und <b>Stil</b> wählst.
            </div>
            <div className="text-xs mt-2">
              Der Stil wird als unveränderte System-Nachricht gesendet.
            </div>
          </div>
        )}

        {items.map((it) => (
          <div
            key={it.id}
            className="flex"
            role="listitem"
            {...(it.id === lastAssistantId
              ? ({ "aria-live": "polite", "aria-atomic": true } as const)
              : {})}
          >
            <MessageBubble role={it.role}>{it.content || " "}</MessageBubble>
          </div>
        ))}

        {/* Anker zum Scrollen ans Ende */}
        <div ref={tailRef} aria-hidden="true" />
      </div>

      <ChatInput value={input} onChange={setInput} onSend={send} busy={busy} />
    </div>
  );
}