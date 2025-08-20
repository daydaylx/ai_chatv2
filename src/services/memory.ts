import { upsertMemory, type MemoryItem } from "../entities/session/db";
import type { ChatMsg } from "./chatStream";
import { stableHash } from "../shared/lib/hash";

export async function extractAndStoreMemory(opts: {
  apiKey: string;
  model: string;
  history: ChatMsg[];
}): Promise<MemoryItem[]> {
  const sys = `Du extrahierst nur langlebige, nützliche Fakten, Präferenzen oder Ziele aus einem Chat.
Gib eine JSON-Liste von Objekten zurück: [{"text": "...", "importance": 1..5}].
Speichere KEINE sensiblen Daten (Gesundheit, Religion, Politik etc.).`;

  const payload = {
    model: opts.model,
    stream: false,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: buildMemoryPrompt(opts.history) }
    ]
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${opts.apiKey}` },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`memory extract failed ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "[]";

  let arr: Array<{ text: string; importance?: number }> = [];
  try { arr = JSON.parse(text); } catch { arr = []; }
  const now = Date.now();
  const items: MemoryItem[] = arr
    .filter(x => x && typeof x.text === "string" && x.text.trim())
    .slice(0, 10)
    .map(x => ({
      id: stableHash(x.text.trim()),
      text: x.text.trim(),
      importance: clamp(Number(x.importance ?? 3), 1, 5),
      updatedAt: now,
    }));
  await upsertMemory(items);
  return items;
}

function buildMemoryPrompt(history: ChatMsg[]): string {
  const recent = history.slice(-16);
  const joined = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  return `Dialog (Auszug):
${joined}

Extrahiere langlebige Informationen (Fakten/Präferenzen/Ziele), die später nützlich sind.
Gib NUR eine JSON-Liste zurück (ohne erklärenden Text).`;
}

function clamp(n: number, a: number, b: number): number {
  if (Number.isNaN(n)) return a;
  return Math.max(a, Math.min(b, n));
}
