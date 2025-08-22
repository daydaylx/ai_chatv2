import type { PersonaModel } from '@/types/models';

/**
 * Liefert einen stabilen, userfreundlichen Anzeigenamen.
 * Reihenfolge der Präferenz: name -> label -> id
 */
export function getModelDisplayName(m: PersonaModel): string {
  const raw = (m.name ?? m.label ?? m.id ?? '').toString();
  return raw.trim();
}

/** Case-insensitive Sortierschlüssel */
export function getModelSortKey(m: PersonaModel): string {
  return getModelDisplayName(m).toLowerCase();
}
