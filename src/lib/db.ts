import Dexie, { Table } from 'dexie';

export type Message = {
  id?: number;
  sessionId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type Session = {
  id?: string;            // string-UUID
  title: string;
  modelId?: string;
  createdAt: number;
  updatedAt: number;
};

export type Setting = {
  key: string;
  value: string;
};

export class AppDB extends Dexie {
  messages!: Table<Message, number>;
  sessions!: Table<Session, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('ai_chat_mobile_pwa');
    this.version(1).stores({
      messages: '++id, sessionId, createdAt',
      sessions: '&id, updatedAt',
      settings: '&key'
    });
  }
}

export const db = new AppDB();

/** CRUD-Helfer (optional) */
export async function addMessage(m: Message) {
  return db.messages.add({ ...m, createdAt: m.createdAt ?? Date.now() });
}
export async function getSession(id: string) {
  return db.sessions.get(id);
}
export async function putSession(s: Session) {
  const now = Date.now();
  return db.sessions.put({ ...s, updatedAt: now, createdAt: s.createdAt ?? now });
}

/** Backup/Restore-Formate */
export type BackupPayload = {
  version: 1;
  exportedAt: number;
  messages: Message[];
  sessions: Session[];
  settings: Setting[];
};

/** Exportiert kompletten DB-Inhalt als Objekt (Backup.tsx stringifiziert selbst) */
export async function exportBackup(): Promise<BackupPayload> {
  const [messages, sessions, settings] = await Promise.all([
    db.messages.toArray(),
    db.sessions.toArray(),
    db.settings.toArray()
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    messages,
    sessions,
    settings
  };
}

/** Importiert JSON-Backup (als String oder Objekt) */
export async function importBackup(input: string | BackupPayload): Promise<void> {
  const payload: BackupPayload = typeof input === 'string' ? JSON.parse(input) : input;
  if (!payload || payload.version !== 1) {
    throw new Error('Ungültiges Backup-Format oder Version.');
  }
  const ensureId = (s: Session): Session => {
    let id = s.id;
    if (!id) {
      const r = (globalThis as any)?.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      id = String(r);
    }
    return { ...s, id };
  };

  await db.transaction('rw', db.messages, db.sessions, db.settings, async () => {
    await db.messages.clear();
    await db.sessions.clear();
    await db.settings.clear();

    if (payload.sessions?.length) {
      await db.sessions.bulkAdd(payload.sessions.map(ensureId));
    }
    if (payload.messages?.length) {
      const msgs = payload.messages.map(m => ({ ...m, createdAt: m.createdAt ?? Date.now() }));
      await db.messages.bulkAdd(msgs);
    }
    if (payload.settings?.length) {
      await db.settings.bulkPut(payload.settings);
    }
  });
}

/** Löscht alle Daten */
export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.messages, db.sessions, db.settings, async () => {
    await db.messages.clear();
    await db.sessions.clear();
    await db.settings.clear();
  });
}
