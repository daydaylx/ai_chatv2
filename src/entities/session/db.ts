// Robuster IndexedDB-Layer mit Null-Safety + Memory-Store.

const DB_NAME = 'ai_chat_v2';
const DB_VERSION = 2;

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
};

export type ChatMessage = {
  pk: number;             // Primärschlüssel (auto-increment)
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
};

export type MemoryItem = {
  id?: number;            // auto-increment
  key: string;            // z.B. sessionId oder global
  text: string;           // gespeicherter Kontext
  updatedAt: number;
  embedding?: number[];   // optional, nicht benötigt
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id' });
        s.createIndex('by_updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('messages')) {
        const m = db.createObjectStore('messages', { keyPath: 'pk', autoIncrement: true });
        m.createIndex('by_session', 'sessionId', { unique: false });
        m.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('memory')) {
        const mem = db.createObjectStore('memory', { keyPath: 'id', autoIncrement: true });
        mem.createIndex('by_key', 'key', { unique: false });
        mem.createIndex('by_updatedAt', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* -------- Sessions -------- */

export async function listSessions(): Promise<ChatSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const out: ChatSession[] = [];
    const req = store.openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        out.push(cur.value as ChatSession);
        cur.continue();
      } else {
        resolve(out.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readonly');
    const idx = tx.objectStore('messages').index('by_session');
    const out: ChatMessage[] = [];
    const req = idx.openCursor(IDBKeyRange.only(sessionId));
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        out.push(cur.value as ChatMessage);
        cur.continue();
      } else {
        resolve(out.sort((a, b) => a.createdAt - b.createdAt));
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Löscht die ältesten Nachrichten einer Session, wenn mehr als maxCount existieren.
 * Gibt die Anzahl der gelöschten Einträge zurück.
 */
export async function pruneOldMessages(sessionId: string, maxCount: number): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const idx = store.index('by_session');
    const list: ChatMessage[] = [];
    const req = idx.openCursor(IDBKeyRange.only(sessionId));
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        list.push(cur.value as ChatMessage);
        cur.continue();
      } else {
        list.sort((a, b) => a.createdAt - b.createdAt);
        const toDelete = Math.max(0, list.length - maxCount);
        if (toDelete <= 0) { resolve(0); return; }
        let deleted = 0;
        for (let i = 0; i < toDelete; i++) {
          const item = list[i];
          if (item && typeof item.pk === 'number') {
            store.delete(item.pk);
            deleted++;
          }
        }
        resolve(deleted);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/* -------- Memory -------- */

export async function upsertMemory(item: Omit<MemoryItem, 'id' | 'updatedAt'> & { id?: number }): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memory', 'readwrite');
    const store = tx.objectStore('memory');
    const now = Date.now();
    const data: MemoryItem = { ...item, updatedAt: now };
    const req = store.put(data);
    req.onsuccess = () => {
      const id = (req.result as number) ?? data.id ?? 0;
      resolve(id);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllMemory(key?: string): Promise<MemoryItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memory', 'readonly');
    const store = tx.objectStore('memory');
    const out: MemoryItem[] = [];
    const cursorReq = key
      ? store.index('by_key').openCursor(IDBKeyRange.only(key))
      : store.openCursor();

    cursorReq.onsuccess = () => {
      const cur = cursorReq.result;
      if (cur) {
        out.push(cur.value as MemoryItem);
        cur.continue();
      } else {
        resolve(out.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}
