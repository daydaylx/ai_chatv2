/**
 * Minimale IndexedDB-Persistenz für Chats.
 * Fallback auf localStorage, wenn IDB nicht verfügbar.
 */
type ChatItem = { role: "system" | "user" | "assistant"; content: string; id: string; ts: number };

const DB_NAME = "aichat-db";
const STORE = "chats";
const KEY = "default";

export async function saveChat(items: ChatItem[]): Promise<void> {
  try {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(items, KEY);
    await tx.done;
    db.close();
  } catch {
    try { localStorage.setItem("chat_items", JSON.stringify(items)); } catch {}
  }
}

export async function loadChat(): Promise<ChatItem[]> {
  try {
    const db = await open();
    const tx = db.transaction(STORE, "readonly");
    const res = await tx.objectStore(STORE).get(KEY);
    await tx.done;
    db.close();
    if (Array.isArray(res)) return res as ChatItem[];
  } catch {
    try {
      const raw = localStorage.getItem("chat_items");
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return [];
}

/** sehr kleine IDB-Util ohne externe Abhängigkeiten */
type MiniDB = { transaction: (name: string, mode: IDBTransactionMode) => { objectStore: (n: string) => IDBObjectStore; done: Promise<void> }, close: () => void };

function open(): Promise<MiniDB> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) return reject(new Error("no idb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const wrap: MiniDB = {
        transaction(name, mode) {
          const tx = db.transaction(name, mode);
          const done = new Promise<void>((res, rej) => {
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
            tx.onabort = () => rej(tx.error);
          });
          return { objectStore: (n) => tx.objectStore(n), done };
        },
        close() { try { db.close(); } catch {} }
      };
      resolve(wrap);
    };
  });
}
