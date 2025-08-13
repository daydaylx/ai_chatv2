import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import ChatListDrawer from "./components/ChatListDrawer";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import TypingIndicator from "./components/TypingIndicator";
import ScrollToBottomButton from "./components/ScrollToBottomButton";
import SettingsDialog from "./components/SettingsDialog";
import { ChatSummary, Message, StyleTemplate } from "./types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const LS_API_KEY = "aichat_api_key";
const LS_MODEL   = "aichat_model_id";
const LS_STYLE   = "aichat_style_id";

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(LS_API_KEY) || "");
  const [modelId, setModelId] = useState<string>(() => localStorage.getItem(LS_MODEL) || "");
  const [styleId, setStyleId] = useState<string>(() => localStorage.getItem(LS_STYLE) || "neutral");
  const [styleMap, setStyleMap] = useState<Record<string, StyleTemplate>>({});

  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(() => uid());

  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const styles: StyleTemplate[] = await fetch("/styles.json").then(r => r.json());
        const map = Object.fromEntries(styles.map(s => [s.id, s]));
        setStyleMap(map);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    setChats([{ id: activeChatId, title: "Neuer Chat", updatedAt: Date.now(), lastSnippet: "Noch keine Nachrichten." }]);
  }, []);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setShowScrollDown(!entries[0]?.isIntersecting),
      { root: listRef.current, threshold: 1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  async function sendToAssistant(userText: string): Promise<string> {
    const system = styleMap[styleId]?.system ?? "";

    // Fallback ohne Key – UI bleibt nutzbar
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 350));
      return (system ? "[Stil aktiv]\n" : "") + "Echo: " + userText;
    }

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId || "openrouter/llama-3.1-8b-instruct:free",
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userText }
        ],
        stream: false
      })
    });

    if (!resp.ok) {
      throw new Error(`API ${resp.status}`);
    }
    const data = await resp.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      "";
    return String(content || "").trim() || "Leere Antwort.";
  }

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: uid(), role: "user", content: text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);
    scrollToBottom();

    try {
      const answer = await sendToAssistant(text);
      const aiMsg: Message = { id: uid(), role: "assistant", content: answer, ts: Date.now() };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      const errMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "Fehler beim Abruf (API/Netzwerk/Key prüfen).",
        ts: Date.now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setIsThinking(false);
      setChats((list) =>
        list.map((c) =>
          c.id === activeChatId
            ? { ...c, updatedAt: Date.now(), lastSnippet: text.slice(0, 80) + (text.length > 80 ? "…" : "") }
            : c
        )
      );
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleNewChat = () => {
    const id = uid();
    setActiveChatId(id);
    setMessages([]);
    setChats((list) => [{ id, title: "Neuer Chat", updatedAt: Date.now(), lastSnippet: "Noch keine Nachrichten." }, ...list]);
    setDrawerOpen(false);
    setTimeout(scrollToBottom, 50);
  };

  const handleSelectChat = (id: string) => {
    // Demo: nur ein aktiver Chat – hier würdest du History laden
    setActiveChatId(id);
    setDrawerOpen(false);
  };

  const handleOpenSettings = () => setSettingsOpen(true);

  const handleSaveSettings = (opts: { apiKey: string; modelId: string; styleId: string }) => {
    setApiKey(opts.apiKey);
    setModelId(opts.modelId);
    setStyleId(opts.styleId);
    localStorage.setItem(LS_API_KEY, opts.apiKey);
    localStorage.setItem(LS_MODEL,   opts.modelId);
    localStorage.setItem(LS_STYLE,   opts.styleId);
    setSettingsOpen(false);
  };

  const title = useMemo(() => {
    const c = chats.find((c) => c.id === activeChatId);
    return c?.title ?? "AI Chat";
  }, [chats, activeChatId]);

  useEffect(() => { setTimeout(scrollToBottom, 50); }, []);

  return (
    <div className="app-root">
      <Header title={title} onMenuClick={() => setDrawerOpen(true)} />

      <main className="chat-main">
        <div className="chat-list" ref={listRef}>
          {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          {isThinking && (
            <div className="bubble-row left">
              <div className="avatar"><span>🤖</span></div>
              <div className="bubble assistant">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} aria-hidden />
        </div>

        <ScrollToBottomButton visible={showScrollDown} onClick={scrollToBottom} />

        <div className="chat-input-wrap">
          <ChatInput onSend={handleSend} disabled={isThinking} />
        </div>
      </main>

      <ChatListDrawer
        open={drawerOpen}
        chats={chats}
        onClose={() => setDrawerOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onOpenSettings={handleOpenSettings}
      />

      <SettingsDialog
        open={settingsOpen}
        initialApiKey={apiKey}
        initialModelId={modelId}
        initialStyleId={styleId}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
