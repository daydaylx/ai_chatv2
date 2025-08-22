import { create } from "zustand";
import { nanoid } from "../util/nanoid";
import {
  type SessionMeta,
  type Message,
  putSession,
  listSessions,
  getSession,
  addMessage,
  listMessagesBySession,
  deleteSession as dbDeleteSession,
  pruneMessages as dbPruneMessages,
} from "./db";

export type SessionState = {
  currentId: string | null;
  sessions: SessionMeta[];
  messages: Message[];
  loading: boolean;
  loadInitial: () => Promise<void>;
  newSession: () => Promise<void>;
  switchSession: (id: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  setRunningSummary: (id: string, summary: string) => Promise<void>;
  appendUser: (content: string) => Promise<Message>;
  appendAssistant: (content: string) => Promise<Message>;
  updateTitleFromFirstUser: () => Promise<void>;
  pruneMessages: (keepLastN: number) => Promise<number>;
  getCurrentRunningSummary: () => Promise<string>;
};

export const useSession = create<SessionState>((set, get) => ({
  currentId: null, sessions: [], messages: [], loading: false,

  loadInitial: async () => {
    set({ loading: true });
    const list = await listSessions();
    if (!list.length) {
      const id = nanoid(); const now = Date.now();
      const meta: SessionMeta = { id, title: "Neue Session", createdAt: now, updatedAt: now, runningSummary: "" };
      await putSession(meta);
      set({ currentId: id, sessions: [meta], messages: [], loading: false });
      return;
    }
    const cur = list[0]; const msgs = await listMessagesBySession(cur.id);
    set({ currentId: cur.id, sessions: list, messages: msgs, loading: false });
  },

  newSession: async () => {
    const id = nanoid(); const now = Date.now();
    const meta: SessionMeta = { id, title: "Neue Session", createdAt: now, updatedAt: now, runningSummary: "" };
    await putSession(meta);
    set({ currentId: id, sessions: await listSessions(), messages: [] });
  },

  switchSession: async (id: string) => {
    const meta = await getSession(id); if (!meta) return;
    const msgs = await listMessagesBySession(id); set({ currentId: id, messages: msgs });
  },

  removeSession: async (id: string) => {
    await dbDeleteSession(id); const list = await listSessions();
    let nextId: string | null = get().currentId;
    if (id === get().currentId) {
      nextId = list[0]?.id ?? null; const msgs = nextId ? await listMessagesBySession(nextId) : [];
      set({ currentId: nextId, messages: msgs, sessions: list }); return;
    }
    set({ sessions: list });
  },

  renameSession: async (id: string, title: string) => {
    const s = await getSession(id); if (!s) return;
    const clean = title.trim().slice(0, 80); s.title = clean || "Session"; s.updatedAt = Date.now();
    await putSession(s); set({ sessions: await listSessions() });
  },

  setRunningSummary: async (id: string, summary: string) => {
    const s = await getSession(id); if (!s) return;
    s.runningSummary = (summary || "").trim(); s.updatedAt = Date.now();
    await putSession(s); set({ sessions: await listSessions() });
  },

  appendUser: async (content: string) => {
    const id = get().currentId ?? nanoid();
    if (!get().currentId) {
      const now = Date.now();
      const meta: SessionMeta = { id, title: "Neue Session", createdAt: now, updatedAt: now, runningSummary: "" };
      await putSession(meta);
      set({ currentId: id, sessions: await listSessions(), messages: [] });
    }
    const msg: Message = { id: nanoid(), sessionId: id, role: "user", content, createdAt: Date.now() };
    await addMessage(msg); const msgs = [...get().messages, msg]; set({ messages: msgs }); return msg;
  },

  appendAssistant: async (content: string) => {
    const id = get().currentId!; const msg: Message = { id: nanoid(), sessionId: id, role: "assistant", content, createdAt: Date.now() };
    await addMessage(msg); const msgs = [...get().messages, msg]; set({ messages: msgs });
    const s = await getSession(id); if (s) { s.updatedAt = Date.now(); if (s.title === "Neue Session") s.title = makeTitleFromConversation(msgs); await putSession(s); set({ sessions: await listSessions() }); }
    return msg;
  },

  updateTitleFromFirstUser: async () => {
    const id = get().currentId; if (!id) return;
    const s = await getSession(id); if (!s) return;
    const firstUser = get().messages.find(m => m.role === "user");
    if (firstUser) { s.title = firstUser.content.slice(0,40).replace(/\s+/g," ").trim(); await putSession(s); set({ sessions: await listSessions() }); }
  },

  pruneMessages: async (keepLastN: number) => {
    const id = get().currentId; if (!id) return 0;
    const removed = await dbPruneMessages(id, keepLastN);
    const msgs = await listMessagesBySession(id); set({ messages: msgs }); return removed;
  },

  getCurrentRunningSummary: async () => {
    const id = get().currentId; if (!id) return "";
    const meta = await getSession(id); return meta?.runningSummary ?? "";
  },
}));

function makeTitleFromConversation(msgs: Message[]): string {
  const firstUser = msgs.find(m => m.role === "user"); if (!firstUser) return "Session";
  const t = firstUser.content.replace(/\s+/g, " ").trim(); return t.length > 40 ? t.slice(0, 40) + "…" : t;
}
