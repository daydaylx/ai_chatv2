import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId?: string;
  personaId?: string;
  archived?: boolean;
  summary?: string;
};

type ChatState = {
  chats: Chat[];
  currentChatId: string | null;
  messages: Record<string, ChatMessage[]>;

  // selectors
  currentChat: () => Chat | null;
  listMessages: (chatId: string | null) => ChatMessage[];

  // actions
  createChat: (init?: Partial<Chat>) => string;
  duplicateChat: (id: string) => string;
  renameChat: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  setCurrentChat: (id: string) => void;
  addMessage: (
    chatId: string,
    msg: Omit<ChatMessage, "id" | "ts"> & Partial<Pick<ChatMessage, "id" | "ts">>
  ) => ChatMessage;
  clearChat: (id: string) => void;
  updateChatMeta: (
    id: string,
    meta: Partial<Pick<Chat, "modelId" | "personaId" | "archived" | "summary">>
  ) => void;
  importData: (data: { chats: Chat[]; messages: Record<string, ChatMessage[]> }) => void;
  exportData: () => { chats: Chat[]; messages: Record<string, ChatMessage[]> };
};

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const initialChat = (): Chat => ({
  id: uuid(),
  title: "Neuer Chat",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [initialChat()],
      currentChatId: null,
      messages: {},

      currentChat: () => {
        const id = get().currentChatId ?? get().chats[0]?.id ?? null;
        if (!id) return null;
        return get().chats.find((c) => c.id === id) ?? null;
      },

      listMessages: (chatId) => {
        if (!chatId) return [];
        return get().messages[chatId] ?? [];
      },

      createChat: (init) => {
        const chat: Chat = {
          ...initialChat(),
          ...init,
          id: uuid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          chats: [chat, ...s.chats],
          currentChatId: chat.id,
        }));
        return chat.id;
      },

      duplicateChat: (id) => {
        const src = get().chats.find((c) => c.id === id);
        if (!src) return get().createChat();
        const dupId = uuid();
        const dup: Chat = {
          ...src,
          id: dupId,
          title: src.title + " (Kopie)",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          chats: [dup, ...s.chats],
          messages: { ...s.messages, [dupId]: [...(s.messages[id] ?? [])] },
          currentChatId: dupId,
        }));
        return dupId;
      },

      renameChat: (id, title) =>
        set((s) => ({
          chats: s.chats.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c)),
        })),

      deleteChat: (id) =>
        set((s) => {
          const rest = s.chats.filter((c) => c.id !== id);
          const msgs = { ...s.messages };
          delete msgs[id];
          const nextId = rest[0]?.id ?? null;
          return {
            chats: rest.length ? rest : [initialChat()],
            messages: msgs,
            currentChatId: nextId,
          };
        }),

      setCurrentChat: (id) => set({ currentChatId: id }),

      addMessage: (chatId, msg) => {
        const message: ChatMessage = {
          id: msg.id ?? uuid(),
          ts: msg.ts ?? Date.now(),
          role: msg.role,
          content: msg.content,
        };
        set((s) => {
          const list = s.messages[chatId] ?? [];
          // Auto-Titel (erste User-Nachricht)
          let chats = s.chats;
          const chat = chats.find((c) => c.id === chatId);
          if (chat) {
            const shouldName =
              chat.title === "Neuer Chat" &&
              msg.role === "user" &&
              !list.some((m) => m.role === "user");
            const newTitle = shouldName ? (msg.content || "Neuer Chat").slice(0, 48) : chat.title;
            chats = chats.map((c) =>
              c.id === chatId ? { ...c, title: newTitle, updatedAt: Date.now() } : c
            );
          }
          return {
            chats,
            messages: { ...s.messages, [chatId]: [...list, message] },
          };
        });
        return message;
      },

      clearChat: (id) =>
        set((s) => ({
          messages: { ...s.messages, [id]: [] },
          chats: s.chats.map((c) => (c.id === id ? { ...c, updatedAt: Date.now() } : c)),
        })),

      updateChatMeta: (id, meta) =>
        set((s) => ({
          chats: s.chats.map((c) => (c.id === id ? { ...c, ...meta, updatedAt: Date.now() } : c)),
        })),

      importData: (data) => set({ chats: data.chats, messages: data.messages }),
      exportData: () => ({ chats: get().chats, messages: get().messages }),
    }),
    {
      name: "chat_store_v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (state) => state as any,
      onRehydrateStorage: () => (state) => {
        const s = state as ChatState | undefined;
        if (s && !s.currentChatId && s.chats[0]) {
          s.currentChatId = s.chats[0].id;
        }
      },
    }
  )
);
