import { create } from "zustand";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number; // epoch ms
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  summary?: string;
  memories?: string[];
  memAuto?: boolean;
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;

  // selectors / derived
  currentChat: Chat | null;

  // core chat actions
  createChat: (init?: Partial<Chat>) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  duplicateChat: (id: string) => string;
  setCurrentChat: (id: string | null) => void;

  // messages
  listMessages: (chatId: string | null) => ChatMessage[];
  addMessage: (chatId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => ChatMessage;
  clearChat: (id: string) => void;

  // memory / summary helpers
  setChatSummary: (id: string, summary: string) => void;
  addMemory: (id: string, mem: string) => void;
  updateMemory: (id: string, index: number, mem: string) => void;
  deleteMemory: (id: string, index: number) => void;
  setMemAuto: (id: string, enabled: boolean) => void;
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const makeChat = (title = "Neuer Chat"): Chat => ({
  id: uid(),
  title,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: []
});

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [makeChat()],
  currentChatId: null,

  get currentChat() {
    const s = get();
    const id = s.currentChatId ?? s.chats[0]?.id ?? null;
    return id ? s.chats.find((c) => c.id === id) ?? null : null;
  },

  createChat: (init) => {
    const base = makeChat(init?.title ?? "Neuer Chat");
    const chat: Chat = { ...base, ...init, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    set((s) => ({
      chats: [chat, ...s.chats],
      currentChatId: chat.id
    }));
    return chat.id;
  },

  deleteChat: (id) => {
    set((s) => {
      const rest = s.chats.filter((c) => c.id !== id);
      const nextId = rest[0]?.id ?? null;
      return { chats: rest.length ? rest : [makeChat()], currentChatId: nextId };
    });
  },

  renameChat: (id, title) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    })),

  duplicateChat: (id) => {
    const src = get().chats.find((c) => c.id === id);
    if (!src) return get().createChat();
    const dupId = uid();
    const dup: Chat = {
      ...src,
      id: dupId,
      title: src.title + " (Kopie)",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [...src.messages]
    };
    set((s) => ({
      chats: [dup, ...s.chats],
      currentChatId: dupId
    }));
    return dupId;
  },

  setCurrentChat: (id) => set({ currentChatId: id }),

  listMessages: (chatId) => {
    if (!chatId) return [];
    return get().chats.find((c) => c.id === chatId)?.messages ?? [];
  },

  addMessage: (chatId, msg) => {
    const message: ChatMessage = {
      id: uid(),
      createdAt: Date.now(),
      role: msg.role,
      content: msg.content
    };
    set((s) => {
      const chats = s.chats.map((c) => {
        if (c.id !== chatId) return c;
        const isFirstUser = msg.role === "user" && !c.messages.some((m) => m.role === "user");
        const newTitle =
          c.title === "Neuer Chat" && isFirstUser
            ? (msg.content || "Neuer Chat").slice(0, 48)
            : c.title;
        return {
          ...c,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...c.messages, message]
        };
      });
      return { chats };
    });
    return message;
  },

  clearChat: (id) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c))
    })),

  setChatSummary: (id, summary) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, summary, updatedAt: Date.now() } : c))
    })),

  addMemory: (id, mem) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id ? { ...c, memories: [...(c.memories ?? []), mem], updatedAt: Date.now() } : c
      )
    })),

  updateMemory: (id, index, mem) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id && c.memories
          ? {
              ...c,
              memories: c.memories.map((m, i) => (i === index ? mem : m)),
              updatedAt: Date.now()
            }
          : c
      )
    })),

  deleteMemory: (id, index) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id && c.memories
          ? { ...c, memories: c.memories.filter((_, i) => i !== index), updatedAt: Date.now() }
          : c
      )
    })),

  setMemAuto: (id, enabled) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, memAuto: enabled, updatedAt: Date.now() } : c))
    }))
}));
