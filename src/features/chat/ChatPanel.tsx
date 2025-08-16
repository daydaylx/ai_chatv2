import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useChatStore } from "@/entities/chat/store";
import type { ORMessage } from "@/lib/openrouter";
import { OpenRouterClient } from "@/lib/openrouter";

type Props = {
  client: OpenRouterClient;
  modelId: string;
  apiKeyPresent: boolean;
  onOpenSettings: () => void;
  systemPrompt?: string;
  onOpenChats?: () => void;
};

export default function ChatPanel({
  client,
  modelId,
  apiKeyPresent,
  onOpenSettings,
  systemPrompt
}: Props) {
  const currentChat = useChatStore((s) => s.currentChat());
  const chatId = currentChat?.id ?? null;
  const messages = useChatStore((s) => s.listMessages(chatId));
  const addMessage = useChatStore((s) => s.addMessage);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const disabledReason = useMemo(() => {
    if (!chatId) return "Kein Chat ausgewählt";
    // Wir lassen Senden auch ohne Key/Modell zu (Mock-Mode).
    return "";
  }, [chatId]);

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
  }, [messages, busy]);

  async function send() {
    if (busy || !input.trim() || !chatId) return;

    const trimmed = input.trim();
    setInput("");

    // user message in store
    const user = addMessage(chatId, { role: "user", content: trimmed });

    setBusy(true);
    try {
      const historyMsgs = messages.map(({ role, content }) => ({ role, content })) as ORMessage[];
      const baseMsgs = systemPrompt ? [{ role: "system", content: systemPrompt } as ORMessage, ...historyMsgs] : historyMsgs;

      const res = await client.chat({
        model: modelId,
        messages: [...baseMsgs, { role: "user", content: user.content }],
        temperature: 0.7,
        max_tokens: 1024
      });

      addMessage(chatId, { role: "assistant", content: res.content });
    } catch (e: any) {
      addMessage(chatId, { role: "assistant", content: `❌ ${e?.message ?? String(e)}` });
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

  const renderItems = messages.filter((m) => m.role !== "system");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Hinweisleiste, wenn Key/Modell fehlen (Mock-Mode ist aktiv) */}
      <AnimatePresence>
        {!apiKeyPresent || !modelId ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-amber-400/20 bg-amber-400/10 px-4 py-3">
              <span className="text-sm text-amber-300">
                Demo-Modus aktiv (kein API-Key/Modell). Öffne die Einstellungen und trage deinen OpenRouter-Key ein.
              </span>
              <button
                onClick={onOpenSettings}
                className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/30"
              >
                Einstellungen
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Scrollbereich */}
      <div
        ref={listRef}
        className="scroll-smooth overscroll-y-contain -webkit-overflow-scrolling-touch flex-1 min-h-0 overflow-y-auto px-4 py-6 pb-28 md:py-8 md:pb-32"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <AnimatePresence mode="popLayout">
            {renderItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={clsx("flex", item.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={clsx(
                    "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3",
                    item.role === "user"
                      ? "ml-8 bg-gradient-to-br from-primary to-primary/80 text-white"
                      : "mr-8 border border-border/50 bg-secondary/50 backdrop-blur"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words text-sm md:text-base">{item.content}</div>
                  <div
                    className={clsx(
                      "mt-2 text-xs opacity-60",
                      item.role === "user" ? "text-right text-white" : ""
                    )}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {busy && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="mr-8 rounded-2xl border border-border/50 bg-secondary/50 px-4 py-3 backdrop-blur">
                <div className="loading-dots flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sticky Composer */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky bottom-0 z-20 border-t border-border/50 bg-background/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl gap-3">
          <textarea
            ref={taRef}
            rows={1}
            className="min-h-[44px] max-h-[160px] flex-1 resize-none rounded-xl border border-border/50 bg-secondary/60 px-4 py-3 text-sm placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
            placeholder="Nachricht schreiben..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!!disabledReason || busy}
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={send}
            disabled={!!disabledReason || busy || !input.trim()}
            className={clsx(
              "fab-send",
              (!!disabledReason || busy || !input.trim()) &&
                "cursor-not-allowed !bg-secondary/60 !text-muted-foreground !shadow-none"
            )}
            aria-label="Senden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
