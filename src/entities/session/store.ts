import { useSyncExternalStore } from "react";

export type AnyMessage = any;

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AnyMessage[];
};

export type SessionState = {
  sessions: Record<string, Session>;
  activeId?: string;
};

type Listener = () => void;
type Unsubscribe = () => void;

function now() {
  return Date.now();
}

function createStore() {
  let state: SessionState = { sessions: {}, activeId: undefined };
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const l of listeners) l();
  };

  const get = () => state;

  const set = (
    partial: Partial<SessionState> | ((prev: SessionState) => Partial<SessionState>)
  ) => {
    const next =
      typeof partial === "function"
        ? (partial as (p: SessionState) => Partial<SessionState>)(state)
        : partial;
    state = { ...state, ...next };
    notify();
  };

  const subscribe = (listener: Listener): Unsubscribe => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  // Actions
  const createSession = (title?: string): string => {
    const id = crypto.randomUUID();
    const s: Session = {
      id,
      title: title?.trim() || "Neue Session",
      createdAt: now(),
      updatedAt: now(),
      messages: [],
    };
    set((prev) => ({ sessions: { ...prev.sessions, [id]: s }, activeId: id }));
    return id;
  };

  const renameSession = (id: string, title: string) => {
    set((prev) => {
      const target = prev.sessions[id];
      if (!target) return {};
      return {
        sessions: {
          ...prev.sessions,
          [id]: { ...target, title: title.trim(), updatedAt: now() },
        },
      };
    });
  };

  const removeSession = (id: string) => {
    set((prev) => {
      if (!prev.sessions[id]) return {};
      const next = { ...prev.sessions };
      delete next[id];
      const activeId = prev.activeId === id ? Object.keys(next)[0] : prev.activeId;
      return { sessions: next, activeId };
    });
  };

  const setActive = (id: string | undefined) => set({ activeId: id });

  return {
    // core
    get,
    set,
    subscribe,
    // actions
    createSession,
    renameSession,
    removeSession,
    setActive,
  };
}

const store = createStore();

// Low-level exports (falls extern genutzt)
export const get = store.get;
export const set = store.set;
export const subscribe = store.subscribe;

// React selectors
export function useSessionSelector<T>(selector: (s: SessionState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(get()), () => selector(get()));
}

export function useActiveSession(): Session | undefined {
  return useSessionSelector((s) => (s.activeId ? s.sessions[s.activeId] : undefined));
}

export function useSessions(): Session[] {
  return useSessionSelector((s) =>
    Object.values(s.sessions).sort((a, b) => b.updatedAt - a.updatedAt)
  );
}

// ==== Legacy-Fassade für bestehende Call-Sites ====
// Viele Stellen erwarten `useSession()` mit { sessions: Session[], currentId?: string, messages: AnyMessage[] }.
export function useSession(): {
  sessions: Session[];
  currentId?: string;
  messages: AnyMessage[];
} {
  const sessions = useSessions();
  const active = useActiveSession();
  return {
    sessions,
    currentId: useSessionSelector((s) => s.activeId),
    messages: active?.messages ?? [],
  };
}

// Actions (beibehaltene, klare API)
export const sessionActions = {
  createSession: store.createSession,
  renameSession: store.renameSession,
  removeSession: store.removeSession,
  setActive: store.setActive,
};
