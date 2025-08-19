// Kein übertriebenes Typ-Ballett – wir brauchen nur id + optionale Namen
type ModelLite = { id: string; name?: string; label?: string };

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
export function chooseDefaultModel(models: ModelLite[]): string | null {
  for (const rx of DEFAULT_MODEL_PATTERNS) {
    const hit = models.find(
      (m) => rx.test(m.id) || (m.name && rx.test(m.name)) || (m.label && rx.test(m.label))
    );
    if (hit?.id) return hit.id;
  }
  return null;
}
