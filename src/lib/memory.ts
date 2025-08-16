import type { Role } from "@/stores/chat-store";
import { useChatStore } from "@/stores/chat-store";

/**
 * Baut eine gekürzte Historie für Prompting (z.B. maxTokens / heuristisch).
 * Hier stark vereinfacht – nimmt die letzten N Messages.
 */
export function buildMemoryContext(chatId: string | null, takeLast: number = 12): Array<{ role: Role; content: string }> {
  if (!chatId) return [];
  const s = useChatStore.getState();
  const list = s.listMessages(chatId);
  const tail = list.slice(Math.max(0, list.length - takeLast));
  return tail.map((m) => ({ role: m.role, content: m.content }));
}
