import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { PRESETS } from "../../lib/presets";
import clsx from "clsx";
import Explore from "../home/Explore";

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
  const [items, setItems] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const systemMsg = useMemo<ChatMessage | null>(() => {
    const preset = PRESETS.find((p) => p.id === personaId);
    return preset ? { role: "system", content: preset.system } : null;
  }, [personaId]);

  const presetLabel = useMemo(() => PRESETS.find(p => p.id === personaId)?.label, [personaId]);

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

  async function send() {
    if (busy || !input.trim()) return;
    if (disabledReason) { onOpenSettings(); return; }

    const trimmed = input.trim();
    const userMsg: Bubble = { id: uuid(), role: "user", content: trimmed, ts: Date.now() };

    const historySnapshot = items;
    setInput("");
    setItems((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      const historyMsgs = historySnapshot.map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const baseMsgs = systemMsg ? [systemMsg, ...historyMsgs] : historyMsgs;

      const res = await client.chat({
        model: modelId!,
        messages: [...baseMsgs, { role: "user", content: userMsg.content }],
        temperature: 0.7,
        max_tokens: 1024,
      });

      const botMsg: Bubble = { id: uuid(), role: "assistant", content: res.content, ts: Date.now() };
      setItems((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Bubble = { id: uuid(), role: "assistant", content: `❌ ${e?.message ?? e}`, ts: Date.now() };
      setItems((prev) => [...prev, errMsg]);
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

  const renderItems = items.filter((m) => m.role !== "system");

  const handleQuickInsert = (text: string, sendNow?: boolean) => {
    setInput(text);
    // Fokus in Composer
    setTimeout(() => {
      taRef.current?.focus();
      if (sendNow) send();
    }, 0);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hinweisleiste */}
      <AnimatePresence>
        {disabledReason && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-destructive/12 border-b border-destructive/30 px-4 py-3 text-sm text-destructive">
              {disabledReason} – bitte in den Einstellungen konfigurieren.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explore/Home – nur wenn noch keine Nachrichten */}
      {renderItems.length === 0 && !busy && (
        <div className="py-3">
          <Explore onPick={handleQuickInsert} modelLabel={modelId || undefined} personaLabel={presetLabel} />
        </div>
      )}

      {/* Nachrichtenliste */}
      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {renderItems.length > 0 && (
          <div className="container-mobile py-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {renderItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className={clsx("flex", item.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={clsx(
                      "max-w-[86%] px-4 py-3 rounded-2xl leading-relaxed text-[15px]",
                      item.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary/80 text-white rounded-tr-md"
                        : "glass rounded-tl-md"
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">{item.content}</div>
                    <div
                      className={clsx(
                        "text-[11px] mt-2 opacity-70",
                        item.role === "user" ? "text-right" : "text-left"
                      )}
                    >
                      {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {busy && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="glass px-4 py-3 rounded-2xl rounded-tl-md">
                  <div className="loading-dots flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="safe-b sticky bottom-0 z-40">
        <div className="container-mobile">
          <div className="glass-heavy elev-2 border-t border-white/10 rounded-2xl px-2 py-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={taRef}
                rows={1}
                className="flex-1 min-h-[44px] max-h-[160px] bg-secondary/60 border border-white/10 rounded-xl px-3 py-3 text-[15px] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary/40 focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Nachricht schreiben…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={!!disabledReason || busy}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={send}
                disabled={!!disabledReason || busy || !input.trim()}
                className={clsx(
                  "w-12 h-12 rounded-xl grid place-items-center",
                  (!disabledReason && !busy && input.trim())
                    ? "bg-gradient-to-br from-primary to-primary/80 text-white"
                    : "bg-secondary/60 text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                )}
                aria-label="Senden"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L3 5l16 7-16 7 2-7Zm0 0h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
