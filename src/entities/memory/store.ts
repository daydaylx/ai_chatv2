import React from "react";

export type MemoryEntry = {
  id: string;
  text: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastSeen: number;
  ttlDays: number | null;
  confidence: number; // 0..1
};

export type MemoryState = {
  enabled: boolean;
  autoExtract: boolean;   // NEU: automatische Chat-Extraktion
  entries: MemoryEntry[];
};

type Listener = () => void;

const LS_ENABLED = "memory.enabled.v1";
const LS_AUTO    = "memory.autoExtract.v1";
const LS_ENTRIES = "memory.entries.v1";

function now() { return Date.now(); }
function uuid() { try { return (crypto as any)?.randomUUID?.() ?? ""; } catch { return ""; } }
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function loadInitial(): MemoryState {
  const enabled = safeParse<boolean>(localStorage.getItem(LS_ENABLED), false);
  const auto    = safeParse<boolean>(localStorage.getItem(LS_AUTO), true); // standardmäßig AN, weil gewünscht
  const entries = safeParse<MemoryEntry[]>(localStorage.getItem(LS_ENTRIES), []);
  const pruned = entries.filter(e => {
    if (e.ttlDays == null) return true;
    const ageDays = (now() - (e.lastSeen || e.updatedAt || e.createdAt)) / 86400000;
    return ageDays <= e.ttlDays;
  });
  if (pruned.length !== entries.length) {
    try { localStorage.setItem(LS_ENTRIES, JSON.stringify(pruned)); } catch {}
  }
  return { enabled: !!enabled, autoExtract: !!auto, entries: pruned };
}

const store = {
  state: loadInitial(),
  listeners: new Set<Listener>(),
  set(partial: Partial<MemoryState>) {
    store.state = { ...store.state, ...partial };
    try { localStorage.setItem(LS_ENABLED, JSON.stringify(store.state.enabled)); } catch {}
    try { localStorage.setItem(LS_AUTO,    JSON.stringify(store.state.autoExtract)); } catch {}
    try { localStorage.setItem(LS_ENTRIES, JSON.stringify(store.state.entries)); } catch {}
    store.listeners.forEach(l => l());
  },
  subscribe(l: Listener) { store.listeners.add(l); return () => store.listeners.delete(l); },
};

export function useMemory() {
  const getSnapshot = React.useCallback(() => store.state, []);
  const subscribe = React.useCallback((l: Listener) => store.subscribe(l), []);
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const enable = React.useCallback((on: boolean) => { store.set({ enabled: !!on }); }, []);
  const setAutoExtract = React.useCallback((on: boolean) => { store.set({ autoExtract: !!on }); }, []);

  const add = React.useCallback((text: string, tags: string[] = [], opts?: { ttlDays?: number | null; confidence?: number }) => {
    const entry: MemoryEntry = {
      id: uuid() || `${now()}-${Math.random().toString(36).slice(2,8)}`,
      text: text.trim(),
      tags: (tags || []).map(t => t.trim()).filter(Boolean).slice(0, 8),
      createdAt: now(),
      updatedAt: now(),
      lastSeen: now(),
      ttlDays: typeof opts?.ttlDays === "number" ? opts!.ttlDays! : null,
      confidence: typeof opts?.confidence === "number" ? opts!.confidence! : 0.8,
    };
    const next = [...store.state.entries, entry].slice(-50);
    store.set({ entries: next });
  }, []);

  const update = React.useCallback((id: string, patch: Partial<Omit<MemoryEntry, "id" | "createdAt">>) => {
    const next = store.state.entries.map(e => e.id === id ? { ...e, ...patch, updatedAt: now() } : e);
    store.set({ entries: next });
  }, []);

  const remove = React.useCallback((id: string) => {
    const next = store.state.entries.filter(e => e.id !== id);
    store.set({ entries: next });
  }, []);

  const purge = React.useCallback(() => { store.set({ entries: [] }); }, []);

  const touchAll = React.useCallback(() => {
    const next = store.state.entries.map(e => ({ ...e, lastSeen: now() }));
    store.set({ entries: next });
  }, []);

  return {
    enabled: state.enabled,
    autoExtract: state.autoExtract,
    entries: state.entries,
    enable,
    setAutoExtract,
    add,
    update,
    remove,
    purge,
    touchAll,
  };
}
