import { getAllMemory, type MemoryItem } from '../entities/session/db';

/**
 * Sehr einfache Relevanzwertung ohne Embeddings:
 * - Tokenisiere Query & Memory-Text als Wortmengen
 * - Score = Anzahl Überschneidungen (Case-insensitive)
 */
function simpleScore(query: string, text: string): number {
  const set = (s: string) =>
    new Set(s.toLowerCase().match(/[a-zäöüß0-9]+/gi) ?? []);
  const q = set(query);
  const t = set(text);
  let hits = 0;
  for (const w of q) if (t.has(w)) hits++;
  return hits;
}

/**
 * Wählt topK relevante Memorys für eine Query.
 * Optional: nur für einen bestimmten key (z.B. sessionId).
 */
export async function selectRelevantMemories(query: string, topK = 5, key?: string): Promise<MemoryItem[]> {
  const all = await getAllMemory(key);
  const scored = all.map((m) => ({ m, score: simpleScore(query, m.text) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, topK).map((s) => s.m);
}
