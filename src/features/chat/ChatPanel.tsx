import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { PRESETS } from "../../lib/presets";
import clsx from "clsx";

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const systemMsg = useMemo<ChatMessage | null>(() => {
    const preset = PRESETS.find(p => p.id === personaId);
    return preset ? { role: "system", content: preset.system } : null;
  }, [personaId]);

  const disabledReason = useMemo(() => {
    if (!apiKeyPresent) return "Kein API-Key gesetzt";
    if (!modelId) return "Kein Modell gewählt";
    return "";
  }, [apiKeyPresent, modelId]);

  // autosize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const resize = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; };
    resize();
    ta.addEventListener("input", resize);
    return () => ta.removeEventListener("input", resize);
  }, []);

  // autoscroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
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
    setItems(prev => [...prev, userMsg]);
    setBusy(true);

    try {
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

  const renderItems = items.filter(m => m.role !== "system");

  /* GRID: messages (1fr) + composer (auto) -> composer bleibt immer unten */
  return (
    <div className="h-full grid grid-rows-[1fr_auto]">
      {/* Warn-Bar */}
      <AnimatePresence>
        {disabledReason && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="row-span-1 overflow-hidden"
          >
            <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-destructive">{disabledReason}</span>
              <button
                onClick={onOpenSettings}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
              >
                Einstellungen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="overflow-y-auto px-3 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {renderItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className={clsx("flex", item.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={clsx(
                    "max-w-[88%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm md:text-base",
                    item.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/80 text-white ml-10"
                      : "glass mr-10"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{item.content}</div>
                  <div className={clsx("text-[11px] mt-2 opacity-60", item.role === "user" ? "text-right" : "text-left")}>
                    {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {busy && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="glass px-4 py-3 rounded-2xl mr-10">
                <div className="loading-dots flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Composer – sticky inkl. Safe-Area-Padding */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-heavy border-t border-border/50 p-3 sticky bottom-0 pb-[calc(var(--safe-bottom)+12px)]"
      >
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={taRef}
            rows={1}
            className="flex-1 min-h-[44px] max-h-[160px] px-3 py-3 bg-secondary/50 border border-border/50 rounded-xl resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            placeholder="Nachricht schreiben..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!!disabledReason || busy}
            aria-label="Nachricht"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={send}
            disabled={!!disabledReason || busy || !input.trim()}
            className={clsx(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0",
              (!disabledReason && !busy && input.trim())
                ? "bg-gradient-to-br from-primary to-primary/80 text-white hover:glow-sm"
                : "bg-secondary/50 text-muted-foreground opacity-50 cursor-not-allowed"
            )}
            aria-label="Senden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
