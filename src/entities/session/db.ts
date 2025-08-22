export type SessionMeta = { id: string; title: string; createdAt: number; updatedAt: number; runningSummary?: string; };
export type ChatRole = "system" | "user" | "assistant";
export type Message = { id: string; sessionId: string; role: ChatRole; content: string; createdAt: number; };
export type MemoryItem = { id: string; text: string; importance: number; updatedAt: number; };

const DB_NAME = "ai_chat_db"; const DB_VER = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sessions")) { const s = db.createObjectStore("sessions", { keyPath: "id" }); s.createIndex("updatedAt", "updatedAt"); }
      if (!db.objectStoreNames.contains("messages")) { const m = db.createObjectStore("messages", { keyPath: "id" }); m.createIndex("sessionId", "sessionId"); m.createIndex("createdAt", "createdAt"); }
      if (!db.objectStoreNames.contains("memory")) { const mem = db.createObjectStore("memory", { keyPath: "id" }); mem.createIndex("updatedAt", "updatedAt"); }
    };
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });
}
async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode); const s = t.objectStore(store); const rq = fn(s);
    rq.onsuccess = () => resolve(rq.result as T); rq.onerror = () => reject(rq.error);
  });
}

export async function putSession(meta: SessionMeta): Promise<void> { await tx("sessions","readwrite",(s)=>s.put(meta) as any); }
export async function getSession(id: string): Promise<SessionMeta | undefined> { return tx("sessions","readonly",(s)=>s.get(id) as any); }
export async function listSessions(): Promise<SessionMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction("sessions","readonly"); const idx = t.objectStore("sessions").index("updatedAt");
    const out: SessionMeta[] = []; const rq = idx.openCursor(null,"prev");
    rq.onsuccess = () => { const cur = rq.result; if (cur) { out.push(cur.value as SessionMeta); cur.continue(); } else resolve(out); };
    rq.onerror = () => reject(rq.error);
  });
}
export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(["sessions","messages"],"readwrite");
    t.objectStore("sessions").delete(id);
    const idx = t.objectStore("messages").index("sessionId");
    const rq = idx.openCursor(IDBKeyRange.only(id));
    rq.onsuccess = () => { const cur = rq.result; if (cur) { t.objectStore("messages").delete(cur.primaryKey as IDBValidKey); cur.continue(); } else resolve(); };
    rq.onerror = () => reject(rq.error);
  });
}

export async function addMessage(m: Message): Promise<void> { await tx("messages","readwrite",(s)=>s.put(m) as any); }
export async function listMessagesBySession(sessionId: string): Promise<Message[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction("messages","readonly");
    const idx = t.objectStore("messages").index("sessionId");
    const rq = idx.openCursor(IDBKeyRange.only(sessionId)); const out: Message[] = [];
    rq.onsuccess = () => { const cur = rq.result; if (cur) { out.push(cur.value as Message); cur.continue(); } else resolve(out.sort((a,b)=>a.createdAt-b.createdAt)); };
    rq.onerror = () => reject(rq.error);
  });
}

export async function pruneMessages(sessionId: string, keepLastN: number): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction("messages","readwrite");
    const idx = t.objectStore("messages").index("sessionId");
    const rq = idx.openCursor(IDBKeyRange.only(sessionId));
    const list: Array<{ pk: IDBValidKey; createdAt: number }> = [];
    rq.onsuccess = () => {
      const cur = rq.result;
      if (cur) { const v = cur.value as Message; list.push({ pk: cur.primaryKey as IDBValidKey, createdAt: v.createdAt }); cur.continue(); }
      else { list.sort((a,b)=>a.createdAt-b.createdAt); const toDelete = Math.max(0, list.length - keepLastN);
        for (let i=0;i<toDelete;i++) t.objectStore("messages").delete(list[i].pk); resolve(toDelete); }
    };
    rq.onerror = () => reject(rq.error);
  });
}

export async function upsertMemory(items: MemoryItem[]): Promise<void> {
  if (!items.length) return;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction("memory","readwrite"); const store = t.objectStore("memory");
    for (const it of items) store.put(it);
    t.oncomplete = () => resolve(); t.onerror = () => reject(t.error);
  });
}
export async function getAllMemory(): Promise<MemoryItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction("memory","readonly");
    const idx = t.objectStore("memory").index("updatedAt");
    const rq = idx.openCursor(null,"prev"); const out: MemoryItem[] = [];
    rq.onsuccess = () => { const cur = rq.result; if (cur) { out.push(cur.value as MemoryItem); cur.continue(); } else resolve(out); };
    rq.onerror = () => reject(rq.error);
  });
}
