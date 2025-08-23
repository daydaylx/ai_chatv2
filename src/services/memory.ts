import { upsertMemory, type MemoryItem } from '../entities/session/db';

/**
 * Speichert/aktualisiert einen Memory-Eintrag.
 * key: z.B. 'global' oder eine sessionId
 */
export async function remember(key: string, text: string): Promise<number> {
  const item: Omit<MemoryItem, 'id' | 'updatedAt'> = { key, text };
  return upsertMemory(item);
}
