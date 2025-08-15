import {
  useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage as ORMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import clsx from "clsx";
import { useChatStore } from "../../entities/chat/store";
import { useConfigStore } from "../../entities/config/store";
import Bubble from "../../shared/ui/Bubble";
import CodeBlock, { parseMessageToSegments } from "../../shared/ui/CodeBlock";
import FAB from "../../shared/ui/FAB";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";
import { useEdgeSwipe } from "../../shared/hooks/useEdgeSwipe";

type Props = {
  client: OpenRouterClient;
  modelId: string | "";
  apiKeyPresent: boolean;
  onOpenSettings: () => void;
  personaId: string;
  onOpenChats?: () => void;
};

function vibrate(ms = 15) { try { (navigator as any).vibrate?.(ms); } catch {} }

export default function ChatPanel({
  client, modelId, apiKeyPresent, onOpenSettings, personaId, onOpenChats,
}: Props) {
  const currentChat = useChatStore((s) => s.currentChat());
  const chatId = currentChat?.id ?? null;
  const messages = useChatStore((s) => s.listMessages(chatId));
  const addMessage = useChatStore((s) => s.addMessage);

  const { getPersonaById, load, loaded } = useConfigStore();

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { if (!loaded) void load(); }, [loaded, load]);

  const systemMsg = useMemo<ORMessage | null>(() => {
    const persona = getPersonaById(personaId);
    return persona?.system ? { role: "system", content: persona.system } : null;
  }, [personaId, getPersonaById]);

  const disabledReason = useMemo(() => {
    if (!apiKeyPresent) return "Kein API-Key gesetzt";
    if (!modelId) return "Kein Modell gewählt";
    if (!chatId) return "Kein Chat ausgewählt";
    return "";
  }, [apiKeyPresent, modelId, chatId]);

  // Smart resize textarea
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    const resize = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; };
    resize(); ta.addEventListener("input", resize); return () => ta.removeEventListener("input", resize);
  }, []);

  // auto scroll
  useEffect(() => {
    const el = listRef.current; if (!el) return;
    el.scrollTop = el.scrollHeight + 1000;
  }, [messages, busy]);

  // Pull-to-refresh
  const { offset, active } = usePullToRefresh(listRef, async () => {
    // Beispiel: könnte History neu laden oder „Reconnect“ machen
    await new Promise((r) => setTimeout(r, 350));
  });

  // Edge swipe (open chat list)
  useEdgeSwipe(() => onOpenChats?.());

  async function send() {
    if (busy || !input.trim() || !chatId) return;
    if (disabledReason) { onOpenSettings(); return; }

    const trimmed = input.trim();
    setInput("");
    const user = addMessage(chatId, { role: "user", content: trimmed });
    setBusy(true);
    vibrate(12);

    try {
      const historyMsgs = messages.map(({ role, content }) => ({ role, content })) as ORMessage[];
      const baseMsgs = systemMsg ? [systemMsg, ...historyMsgs] : historyMsgs;

      const res = await client.chat({
        model: modelId!, messages: [...baseMsgs, { role: "user", content: user.content }],
        temperature: 0.7, max_tokens: 1024,
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const renderItems = messages.filter((m) => m.role !== "system");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AnimatePresence>
        {disabledReason && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-danger/20 bg-[hsl(var(--danger))/0.12] px-4 py-3">
              <span className="text-sm text-[hsl(var(--danger))]">{disabledReason}</span>
              <button onClick={onOpenSettings} className="rounded-lg border border-danger/30 px-3 py-1 text-xs text-[hsl(var(--danger))]">Einstellungen</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pull indicator */}
      <div className="relative">
        <motion.div style={{ height: offset }} className="flex items-end justify-center text-xs text-muted-foreground">
          {active && <div className="comet mb-2" />}
        </motion.div>
      </div>

      {/* Scrollbereich */}
      <div
        ref={listRef}
        className="scroll-smooth overscroll-y-contain -webkit-overflow-scrolling-touch flex-1 min-h-0 overflow-y-auto px-4 py-6 pb-28 md:py-8 md:pb-32"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <AnimatePresence mode="popLayout">
            {renderItems.map((item, index) => {
              const segs = parseMessageToSegments(item.content);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, delay: index * 0.03 }}
                >
                  <Bubble role={item.role as "user" | "assistant"} timestamp={item.ts}>
                    {segs.map((s, i) =>
                      s.type === "code" ? <CodeBlock key={i} code={s.value} lang={s.lang} /> :
                      <div key={i} className="whitespace-pre-wrap break-words text-[15px] leading-[1.35]">{s.value}</div>
                    )}
                  </Bubble>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {busy && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bubble bubble-assistant mr-8 px-4 py-3">
                <div className="comet" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Composer */}
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 z-20 border-t border-border/50 bg-background/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl gap-3">
          <textarea
            ref={taRef}
            rows={1}
            className="min-h-[44px] max-h-[160px] flex-1 resize-none rounded-xl border border-border/50 bg-secondary/60 px-4 py-3 text-[15px] placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-[hsl(var(--primary))/0.4]"
            placeholder="Nachricht schreiben…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!!disabledReason || busy}
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => send()}
            disabled={!!disabledReason || busy || !input.trim()}
            className={clsx(
              "ripple flex h-12 w-12 items-center justify-center rounded-xl transition-all",
              !disabledReason && !busy && input.trim()
                ? "bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary-2))] to-[hsl(var(--accent))] text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                : "cursor-not-allowed bg-secondary/60 text-muted-foreground opacity-60"
            )}
            aria-label="Senden"
            onPointerDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              const rect = target.getBoundingClientRect();
              target.style.setProperty("--x", `${e.clientX - rect.left}px`);
              target.style.setProperty("--y", `${e.clientY - rect.top}px`);
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Floating Send (optional, wenn Tastatur zu) */}
      {!input.trim() && !busy && !disabledReason && (
        <FAB onClick={() => { taRef.current?.focus(); }} ariaLabel="Schreiben" />
      )}
    </div>
  );
}
