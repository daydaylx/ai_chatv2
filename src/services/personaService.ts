import type { Persona } from '@/types/models';

/**
 * Lädt Personas bevorzugt aus src/data/personas.json (Vite-Import zur Buildzeit).
 * Fallback: Leere Liste, wenn Datei nicht existiert. Keine Exceptions nach oben.
 * -> Produktionssicher; UI kann den Zustand klar anzeigen.
 */
export async function loadPersonas(): Promise<Persona[]> {
  try {
    // Versuch 1: Buildzeit-Import (funktioniert nur, wenn Datei existiert)
    const mod = await import('@/data/personas.json', { assert: { type: 'json' } } as unknown as undefined);
    // @ts-expect-error: Vite JSON default export
    const data = (mod.default ?? mod) as Persona[];
    if (Array.isArray(data)) return normalize(data);
  } catch (_e) {
    // Ignorieren – weiter unten Fallback
  }
  return [];
}

function normalize(items: Persona[]): Persona[] {
  return items.map(p => ({
    id: p.id,
    title: p.title ?? p.id,
    description: p.description,
    models: Array.isArray(p.models) ? p.models.slice().sort((a, b) => {
      const an = (a.name ?? a.label ?? a.id ?? '').toString().toLowerCase();
      const bn = (b.name ?? b.label ?? b.id ?? '').toString().toLowerCase();
      return an.localeCompare(bn);
    }) : []
  }));
}
