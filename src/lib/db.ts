import Dexie, { Table } from "dexie";

export type Role = "system" | "user" | "assistant";

export interface Session {
  id: string;
  title: string;
  createdAt: number;
}

export interface Message {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  createdAt: number;
  tokens?: number;
}

export interface SettingKV {
  key: string;
  value: unknown;
}

class AppDB extends Dexie {
  sessions!: Table<Session, string>;
  messages!: Table<Message, string>;
  settings!: Table<SettingKV, string>;

  constructor() {
    super("aiChatPWA");
    this.version(1).stores({
      sessions: "id, createdAt",
      messages: "id, sessionId, createdAt",
      settings: "key"
    });
  }
}

export const db = new AppDB();

const CUR_SESSION_KEY = "currentSessionId";

export async function ensureDefaultSession(): Promise<Session> {
  const existingId = localStorage.getItem(CUR_SESSION_KEY);
  if (existingId) {
    const hit = await db.sessions.get(existingId);
    if (hit) return hit;
  }
  const s: Session = { id: crypto.randomUUID(), title: "Privat", createdAt: Date.now() };
  await db.sessions.add(s);
  localStorage.setItem(CUR_SESSION_KEY, s.id);
  return s;
}

export async function getCurrentSession(): Promise<Session> {
  const s = await ensureDefaultSession();
  return s;
}

export async function setCurrentSession(id: string) {
  const has = await db.sessions.get(id);
  if (!has) throw new Error("Session nicht gefunden");
  localStorage.setItem(CUR_SESSION_KEY, id);
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  return db.messages.where("sessionId").equals(sessionId).sortBy("createdAt");
}

export async function addMessage(m: Message): Promise<void> {
  await db.messages.add(m);
}

export async function upsertAssistantMessage(
  sessionId: string,
  ref: { id?: string },
  content: string
): Promise<Message> {
  if (!ref.id) {
    const m: Message = {
      id: crypto.randomUUID(),
      sessionId,
      role: "assistant",
      content,
      createdAt: Date.now()
    };
    await db.messages.add(m);
    ref.id = m.id;
    return m;
  } else {
    await db.messages.update(ref.id, { content });
    const m = await db.messages.get(ref.id);
    if (!m) throw new Error("Assistant-Message nicht gefunden");
    return m;
  }
}

export async function wipeAll(): Promise<void> {
  await db.transaction("rw", db.messages, db.sessions, db.settings, async () => {
    await db.messages.clear();
    await db.sessions.clear();
    await db.settings.clear();
  });
  localStorage.removeItem(CUR_SESSION_KEY);
}

export type BackupSchema = {
  schema: 1;
  exportedAt: string;
  sessions: Session[];
  messages: Message[];
  settings: SettingKV[];
};

export async function exportBackup(): Promise<BackupSchema> {
  const [sessions, messages, settings] = await Promise.all([
    db.sessions.toArray(),
    db.messages.toArray(),
    db.settings.toArray()
  ]);
  return {
    schema: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    messages,
    settings
  };
}

export async function importBackup(data: unknown): Promise<void> {
  const d = data as Partial<BackupSchema> | undefined;
  if (!d || d.schema !== 1 || !Array.isArray(d.sessions) || !Array.isArray(d.messages) || !Array.isArray(d.settings)) {
    throw new Error("Ungültiges Backup-Format (schema != 1)");
  }
  await db.transaction("rw", db.sessions, db.messages, db.settings, async () => {
    await db.sessions.clear();
    await db.messages.clear();
    await db.settings.clear();
    await db.sessions.bulkAdd(d.sessions!);
    await db.messages.bulkAdd(d.messages!);
    await db.settings.bulkAdd(d.settings!);
  });
  const first = d.sessions![0];
  if (first?.id) localStorage.setItem(CUR_SESSION_KEY, first.id);
}
