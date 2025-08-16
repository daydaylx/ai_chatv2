import { create } from "zustand";
import { nanoid } from "nanoid";

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  summary?: string;
  memories?: string[];
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;

  // Core actions
  createChat: () => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  duplicateChat: (id: string) => string;

  setCurrentChat: (id: string | null) => void;
  currentChat: Chat | null;

  addMessage: (chatId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => ChatMessage;
  listMessages: (chatId: string) => ChatMessage[];

  setChatSummary: (id: string, summary: string) => void;

  addMemory: (id: string, mem: string) => void;
  updateMemory: (id: string, index: number, mem: string) => void;
  deleteMemory: (id: string, index: number) => void;
  setMemAuto: (id: string, enabled: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,

  createChat: () => {
    const id = nanoid();
    const newChat: Chat = { id, title: "Neuer Chat", messages: [] };
    set((s) => ({ chats: [...s.chats, newChat], currentChatId: id }));
    return id;
  },

  deleteChat: (id) => {
    set((s) => ({
      chats: s.chats.filter((c) => c.id !== id),
      currentChatId: s.currentChatId === id ? null : s.currentChatId,
    }));
  },

  renameChat: (id, title) => {
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
  },

  duplicateChat: (id) => {
    const original = get().chats.find((c) => c.id === id);
    if (!original) return "";
    const newId = nanoid();
    const copy: Chat = { ...original, id: newId, title: original.title + " (Kopie)" };
    set((s) => ({ chats: [...s.chats, copy] }));
    return newId;
  },

  setCurrentChat: (id) => set(() => ({ currentChatId: id })),
  get currentChat() {
    const s = get();
    return s.chats.find((c) => c.id === s.currentChatId) ?? null;
  },

  addMessage: (chatId, msg) => {
    const newMsg: ChatMessage = { id: nanoid(), createdAt: new Date(), ...msg };
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, newMsg] } : c
      ),
    }));
    return newMsg;
  },

  listMessages: (chatId) => {
    return get().chats.find((c) => c.id === chatId)?.messages ?? [];
  },

  setChatSummary: (id, summary) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, summary } : c)),
    })),

  addMemory: (id, mem) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id ? { ...c, memories: [...(c.memories ?? []), mem] } : c
      ),
    })),

  updateMemory: (id, index, mem) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id && c.memories
          ? {
              ...c,
              memories: c.memories.map((m, i) => (i === index ? mem : m)),
            }
          : c
      ),
    })),

  deleteMemory: (id, index) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id && c.memories
          ? { ...c, memories: c.memories.filter((_, i) => i !== index) }
          : c
      ),
    })),

  setMemAuto: (id, enabled) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === id ? { ...c, memAuto: enabled } : c
      ),
    })),
}));
