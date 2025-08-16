import { create } from "zustand";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  persona?: string;
  createdAt: number;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId?: string;

  // Actions
  createSession: (title?: string, modelId?: string, persona?: string) => void;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  clearMessages: (sessionId: string) => void;
  deleteSession: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: undefined,

  createSession: (title = "Neue Unterhaltung", modelId = "default", persona) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title,
      modelId,
      persona,
      messages: [],
      createdAt: Date.now(),
    };
    set((state) => ({
      sessions: [...state.sessions, newSession],
      activeSessionId: newSession.id,
    }));
  },

  setActiveSession: (id) => {
    set(() => ({ activeSessionId: id }));
  },

  addMessage: (sessionId, message) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      ),
    }));
  },

  removeMessage: (sessionId, messageId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: s.messages.filter((m) => m.id !== messageId) }
          : s
      ),
    }));
  },

  clearMessages: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: [] } : s
      ),
    }));
  },

  deleteSession: (id) => {
    set((state) => {
      const filtered = state.sessions.filter((s) => s.id !== id);
      return {
        sessions: filtered,
        activeSessionId: filtered.length > 0 ? filtered[0].id : undefined,
      };
    });
  },
}));
