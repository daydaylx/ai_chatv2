import { type ChatMsg, streamChat } from "./chatStream";
import { upsertMemory, type MemoryItem } from "../entities/session/db";

export async function extractAndStoreMemory({ apiKey, model, history }: { apiKey: string; model: string; history: ChatMsg[]; }) {
  const sys = "Extrahiere langlebige, nicht sensible Fakten/Präferenzen über den Nutzer. Antworte NUR als JSON-Array von Objekten: [{\"text\": string, \"importance\": 1..5}]. Keine Erklärung.";
  const user = "Analysiere die letzten Nachrichten und gib 0-6 prägnante Einträge zurück.";
  let acc = "";
  await streamChat({
    apiKey, model, system: sys, messages: history.concat({ role: "user", content: user }),
    maxTokensOut: 400,
    onToken: (t) => { acc += t; },
    onDone: () => {},
    onError: (e) => { throw e; },
  });
  let items: Array<{ text: string; importance: number }> = [];
  try { items = JSON.parse(acc); } catch { items = []; }
  const now = Date.now();
  const mapped: MemoryItem[] = items
    .filter(x => x && typeof x.text === "string" && x.text.trim())
    .map(x => ({
      id: hashId(x.text),
      text: x.text.trim(),
      importance: clamp(Math.round(x.importance ?? 3), 1, 5),
      updatedAt: now,
    }));
  if (mapped.length) await upsertMemory(mapped);
}

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function hashId(s: string): string {
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return "mem_" + (h >>> 0).toString(16);
}
