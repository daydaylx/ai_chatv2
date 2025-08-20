import { getAllMemory, type MemoryItem } from "../entities/session/db";

/**
 * Wählt die top-k relevanten Memory-Items anhand des Overlaps mit der aktuellen User-Eingabe
 * und einem einfachen Importance/Recency-Boost.
 */
export async function selectRelevantMemory(userText: string, topK = 5): Promise<MemoryItem[]> {
  const all = await getAllMemory();
  if (!all.length || !userText.trim()) return [];
  const terms = tokenize(userText);
  const now = Date.now();

  const scored = all.map((m) => {
    const overlap = jaccard(terms, tokenize(m.text));
    const recency = 1 / (1 + Math.log1p((now - m.updatedAt) / (1000 * 60 * 60 * 24))); // ~1..0
    const importance = 1 + (m.importance - 3) * 0.15; // 1±0.3
    const score = overlap * (0.6 + 0.4 * recency) * importance;
    return { m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.m);
}

/** Composed Memory-Block für Systemprompt. */
export function renderMemorySystemBlock(items: MemoryItem[]): string | null {
  if (!items.length) return null;
  const bullets = items.map((it) => `• ${it.text}`).join("\n");
  return `Bekannte, langlebige Fakten/Präferenzen über den Nutzer (nur wenn relevant anwenden):\n${bullets}`;
}

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/g)
      .filter(Boolean)
      .map(stem)
  );
}

function stem(w: string): string {
  // primitive Stemming/normalization
  return w.replace(/(en|er|n|e|s)$/g, "");
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter;
  return uni ? inter / uni : 0;
}
