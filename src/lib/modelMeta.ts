import type { PersonaModel } from "../entities/persona";

/** Anzeigename eines Modells (fallback auf id). */
export function modelLabel(m: PersonaModel): string {
  return (m.name?.trim() || m.id).trim();
}

/** Kleinschreib-Schlüssel für Vergleiche/Sortierung. */
export function modelKey(m: PersonaModel): string {
  return modelLabel(m).toLowerCase();
}

/** Volltext-Blob für Suche/Filter. */
export function modelBlob(m: PersonaModel): string {
  return [m.id, m.name ?? "", m.description ?? "", ...(m.tags ?? [])]
    .join(" ")
    .toLowerCase();
}

/** Einfache Textsuche gegen id/name/description/tags. */
export function matchesModelQuery(m: PersonaModel, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return modelBlob(m).includes(s);
}

/** Flag-Filter in einem Rutsch anwenden. */
export type ModelFlags = { free?: boolean; fast?: boolean; allow_nsfw?: boolean };
export function hasFlags(m: PersonaModel, f: ModelFlags): boolean {
  if (f.free && !m.free) return false;
  if (f.fast && !m.fast) return false;
  if (f.allow_nsfw && !m.allow_nsfw) return false;
  return true;
}

/* ---- Aliase für mögliche Alt-Imports (Abwärtskompatibilität) ---- */
export const labelOf = modelLabel;
export const keyOf = modelKey;
export const blobOf = modelBlob;
export const matchesQuery = matchesModelQuery;
