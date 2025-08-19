import type { ModelVM } from "../lib/catalog";

/** robuste Patterns, falls ID/Name je nach Provider leicht variieren */
const DEFAULT_MODEL_PATTERNS = [
  /venice.*dolphin.*mistral.*24b/i,
  /venice.*dolphin.*24b/i,
  /^venice/i, // Fallback: Venice-Provider
];

/**
 * Wählt das Standardmodell "Venice Dolphin Mistral 24B Venice Edition", wenn vorhanden.
 * Gibt die ID zurück oder null, wenn kein Kandidat gefunden wurde.
 */
export function chooseDefaultModel(models: Pick<ModelVM, "id"> & Partial<Pick<ModelVM, "name" | "label">>[] ): string | null {
  for (const rx of DEFAULT_MODEL_PATTERNS) {
    const hit = models.find(m => rx.test(m.id) || (m.name && rx.test(m.name)) || (m.label && rx.test(m.label as string)));
    if (hit?.id) return hit.id;
  }
  return null;
}
