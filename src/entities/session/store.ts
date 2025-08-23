// Store mit Null-Safety + React-Hook useSession().
import React from 'react';
import { listSessions, listMessagesBySession, type ChatSession } from './db';

export type SessionState = {
  currentId?: string;
  sessions: ChatSession[];
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; createdAt?: number }>;
  loading: boolean;
};

const state: SessionState = {
  currentId: undefined,
  sessions: [],
  messages: [],
  loading: false
};

type Listener = (s: SessionState) => void;
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn(state);
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  // Cleanup MUSS void zurückgeben (nicht boolean)
  return () => {
    listeners.delete(fn);
  };
}

export async function initSessions() {
  state.loading = true; emit();
  const list = await listSessions();
  state.sessions = list;
  const cur = list.length > 0 ? list[0] : undefined;
  if (cur) {
    state.currentId = cur.id;
    state.messages = await listMessagesBySession(cur.id);
  } else {
    state.currentId = undefined;
    state.messages = [];
  }
  state.loading = false; emit();
}

export function getSessionState(): SessionState {
  return { ...state, sessions: [...state.sessions], messages: [...state.messages] };
}

// React Hook für Komponenten
export function useSession(): SessionState {
  const [snap, setSnap] = React.useState<SessionState>(() => getSessionState());
  React.useEffect(() => subscribe(setSnap), []);
  return snap;
}
