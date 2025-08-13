import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import ChatListDrawer from "./components/ChatListDrawer";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import TypingIndicator from "./components/TypingIndicator";
import ScrollToBottomButton from "./components/ScrollToBottomButton";
import { ChatSummary, Message } from "./types";

/** ---------- Utils ---------- */
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
const LS_KEY = "acp:v1";

/** ---------- Persistenz ---------- */
type StoreShape = {
  chats: ChatSummary[];
  messagesByChat: Record<string, Message[]>;
};

function loadStore(): StoreShape | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreShape;
    // Basisschutz gegen kaputte Daten
    if (!parsed || !Array.isArray(parsed.chats) || typeof parsed.messagesByChat !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStore(next: StoreShape) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // Ignorieren (privates Testing, Speicher kann voll sein)
  }
}

/** ---------- App ---------- */
export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [storeLoaded, setStoreLoaded] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  /** ---- Initial Load ---- */
  useEffect(() => {
    const fromLs = loadStore();
    if (fromLs && fromLs.chats.length > 0) {
      // Wähle jüngsten Chat
      const sorted = [...fromLs.chats].sort((a, b) => b.updatedAt - a.updatedAt);
      const currentId = sorted[0].id;
      setChats(sorted);
      setActiveChatId(currentId);
      setMessages(fromLs.messagesByChat[currentId] ?? []);
    } else {
      // Fresh
      const id = uid();
      const initialChat: ChatSummary = {
        id,
        title: "Neuer Chat",
        updatedAt: Date.now(),
        lastSnippet: "Noch keine Nachrichten.",
      };
      setChats([initialChat]);
      setActiveChatId(id);
      setMessages([]);
      // Direkt speichern
      saveStore({ chats: [initialChat], messagesByChat: { [id]: [] } });
    }
    setStoreLoaded(true);
    // ans Ende scrollen
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" }), 50);
  }, []);

  /** ---- IntersectionObserver: FAB zeigen/verstecken ---- */
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

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, []);

  /** ---- Store Sync (Chats + Messages des aktiven Chats) ---- */
  useEffect(() => {
    if (!storeLoaded || !activeChatId) return;
    // Wir speichern NUR zusammengeführte Struktur, um Write-Amplification zu minimieren
    const byId: Record<string, Message[]> = {};
    const prev = loadStore();
    if (prev) {
      Object.assign(byId, prev.messagesByChat);
    }
    byId[activeChatId] = messages;
    saveStore({ chats, messagesByChat: byId });
  }, [storeLoaded, activeChatId, messages, chats]);

  /** ---- Titel ableiten aus erster User-Nachricht ---- */
  useEffect(() => {
    if (!activeChatId || messages.length === 0) return;
    // Falls Titel noch Standard ist, nutze die erste User-Nachricht
    const c = chats.find((c) => c.id === activeChatId);
    if (!c || (c.title && c.title !== "Neuer Chat")) return;
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return;
    const title = firstUser.content.trim().slice(0, 40).replace(/\s+/g, " ");
    if (title.length === 0) return;
    setChats((list) =>
      list.map((x) => (x.id === activeChatId ? { ...x, title } : x))
    );
  }, [messages, activeChatId, chats]);

  /** ---- Dummy-Backend (ersetzen durch echtes API-Call) ---- */
  async function sendToAssistant(userText: string): Promise<string> {
    // Hier deinen echten Fetch/Client reinhängen:
    // const r = await fetch("/api/chat", { ... });
    // const data = await r.json();
    // return data.text;

    // Demo: kleines intelligentes Echo
    await new Promise((r) => setTimeout(r, 450));
    if (userText.toLowerCase().includes("zeit")) {
      return "Die aktuelle Zeit ist: " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return "Du sagtest: " + userText;
  }

  /** ---- Senden ---- */
  const handleSend = async (text: string) => {
    if (!activeChatId) return;
    const now = Date.now();

    const userMsg: Message = { id: uid(), role: "user", content: text, ts: now };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);
    scrollToBottom(false);

    try {
      const answer = await sendToAssistant(text);
      const aiMsg: Message = { id: uid(), role: "assistant", content: answer, ts: Date.now() };
      setMessages((m) => [...m, aiMsg]);
      // Chat-Summary aktualisieren
      setChats((list) =>
        list
          .map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  lastSnippet: text.slice(0, 80) + (text.length > 80 ? "…" : ""),
                }
              : c
          )
          // Optional: aktiv nach oben sortieren
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    } catch {
      const errMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "Fehler beim Abrufen der Antwort. Bitte Verbindung/Key prüfen.",
        ts: Date.now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setIsThinking(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  };

  /** ---- Neuer Chat ---- */
  const handleNewChat = () => {
    const id = uid();
    const newChat: ChatSummary = {
      id,
      title: "Neuer Chat",
      updatedAt: Date.now(),
      lastSnippet: "Noch keine Nachrichten.",
    };
    setChats((list) => [newChat, ...list]);
    setActiveChatId(id);
    setMessages([]);
    setDrawerOpen(false);

    // Sofort persistieren, damit wir keinen Race verlieren
    const prev = loadStore() ?? { chats: [], messagesByChat: {} };
    prev.chats = [newChat, ...prev.chats];
    prev.messagesByChat[id] = [];
    saveStore(prev);

    setTimeout(() => scrollToBottom(false), 50);
  };

  /** ---- Chat auswählen ---- */
  const handleSelectChat = (id: string) => {
    const prev = loadStore();
    setActiveChatId(id);
    setDrawerOpen(false);
    setMessages(prev?.messagesByChat[id] ?? []);
    // kein Scroll-Jump, aber zeitnah nach unten
    setTimeout(() => scrollToBottom(false), 50);
  };

  /** ---- (Platzhalter) Einstellungen ---- */
  const openSettings = () => {
    alert("Einstellungen: API-Key & Modellwahl hier einbauen (eigener Dialog oder Drawer).");
  };

  const title = useMemo(() => {
    const c = chats.find((c) => c.id === activeChatId);
    return c?.title ?? "AI Chat";
  }, [chats, activeChatId]);

  if (!storeLoaded) {
    // Minimaler Splash – blockt flackerfreien ersten Render
    return (
      <div className="app-root" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ opacity: 0.8, fontSize: 14, color: "#9aa4ae" }}>Lade…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Header title={title} onMenuClick={() => setDrawerOpen(true)} />

      <main className="chat-main">
        <div className="chat-list" ref={listRef}>
          {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          {isThinking && (
            <div className="bubble-row left">
              <div className="avatar"><span>🤖</span></div>
              <div className="bubble assistant"><TypingIndicator /></div>
            </div>
          )}
          <div ref={bottomRef} aria-hidden />
        </div>

        <ScrollToBottomButton visible={showScrollDown} onClick={() => scrollToBottom(true)} />

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
        onOpenSettings={openSettings}
      />
    </div>
  );
}
