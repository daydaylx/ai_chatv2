import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage as ORMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import clsx from "clsx";
import { useChatStore } from "../../entities/chat/store";
import { buildContext, maybeSummarize, maybeExtractMemories } from "../../lib/memory";
import { PRESETS } from "../../lib/presets";

type Props = {
  client: OpenRouterClient;
  modelId: string | "";
  apiKeyPresent: boolean;
  onOpenSettings: () => void;
  personaId: string;
};

function uuid() {
  if ((globalThis as any)?.crypto?.randomUUID) return (globalThis as any).crypto.randomUUID();
  return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
}

export default function ChatPanel({
  client,
  modelId,
  apiKeyPresent,
  onOpenSettings,
  personaId,
}: Props) {
  const currentChat = useChatStore((s) => s.currentChat());
  const chatId = currentChat?.id ?? null;
  const messages = useChatStore((s) => s.listMessages(chatId));
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const settings = useChatStore((s) => s.settings);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const disabledReason = useMemo(() => {
    if (!apiKeyPresent) return "Kein API-Key gesetzt";
    if (!modelId) return "Kein Modell gewählt";
    if (!chatId) return "Kein Chat ausgewählt";
    return "";
  }, [apiKeyPresent, modelId, chatId]);

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

    if (disabledReason) {
      onOpenSettings();
      return;
    }

    setErr(null);

    const trimmed = input.trim();
    setInput("");

    // user message in Store
    const user = addMessage(chatId, { role: "user", content: trimmed });

    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      // Kontext aufbauen: system (preset + summary + pinned memories) + letzte Nachrichten
      const s = useChatStore.getState();
      const { messages: ctxMsgs } = buildContext(chatId, personaId, s.settings.maxContextChars);

      // Falls Persona kein eigenes system gesetzt hat, lege es (optional) an
      const preset = PRESETS.find((p) => p.id === personaId);
      const finalCtx: ORMessage[] = [];
      if (preset?.system && !(ctxMsgs[0]?.role === "system" && ctxMsgs[0].content.includes(preset.system))) {
        finalCtx.push({ role: "system", content: preset.system });
      }
      finalCtx.push(...ctxMsgs);

      if (settings.streaming) {
        // vorab leere Bot-Blase anlegen
        const bot = addMessage(chatId, { role: "assistant", content: "" });
        let agg = "";

        const res = await client.chat({
          model: modelId!,
          messages: [...finalCtx, { role: "user", content: user.content }],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
          signal: ac.signal,
          onDelta: (tok: string) => {
            agg += tok;
            updateMessage(chatId, bot.id, { content: agg });
          },
        });

        // Sicherheit: finaler Content
        updateMessage(chatId, bot.id, { content: res.content || agg });
      } else {
        const res = await client.chat({
          model: modelId!,
          messages: [...finalCtx, { role: "user", content: user.content }],
          temperature: 0.7,
          max_tokens: 1024,
        });

        addMessage(chatId, { role: "assistant", content: res.content });
      }

      // Nachlauf: optional automatisch zusammenfassen + memories extrahieren
      await maybeSummarize(chatId, client).catch(() => {});
      await maybeExtractMemories(chatId, client).catch(() => {});
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      addMessage(chatId, { role: "assistant", content: "❌ " + (e?.message ?? String(e)) });
    } finally {
      setBusy(false);
      abortRef.current = null;
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }

  function stop() {
    abortRef.current?.abort();
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
      <AnimatePresence>
        {disabledReason && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-destructive/20 bg-destructive/10 px-4 py-3">
              <span className="text-sm text-destructive">{disabledReason}</span>
              <button
                onClick={onOpenSettings}
                className="rounded-lg bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/30"
              >
                Einstellungen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {err && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-2 text-sm text-destructive">
          Fehler: {err}
        </motion.div>
      )}

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
                  <div className={clsx("mt-2 text-xs opacity-60", item.role === "user" ? "text-right text-white" : "")}>
                    {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 z-20 border-t border-border/50 bg-background/70 px-4 py-3 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl gap-3">
          <textarea
            ref={taRef}
            rows={1}
            inputMode="text"
            enterKeyHint="send"
            className="min-h-[44px] max-h-[160px] flex-1 resize-none rounded-xl border border-border/50 bg-secondary/60 px-4 py-3 text-sm placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
            placeholder="Nachricht schreiben…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!!disabledReason || busy}
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          />
          {!busy ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={send}
              disabled={!!disabledReason || !input.trim()}
              className={clsx(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                !disabledReason && input.trim()
                  ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                  : "cursor-not-allowed bg-secondary/60 text-muted-foreground opacity-60"
              )}
              aria-label="Senden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stop}
              className="flex h-12 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 px-4 text-sm text-destructive hover:bg-destructive/20"
              aria-label="Stop"
            >
              Stop
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
