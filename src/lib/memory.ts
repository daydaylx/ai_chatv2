import type { ChatMessage as ORMessage } from "./openrouter";
import { useChatStore } from "../entities/chat/store";
import { useConfigStore } from "../entities/config/store";

/** grob: 1 Token ~ 4 Zeichen */
export function approxTokensFromChars(chars: number) {
  return Math.ceil(chars / 4);
}

export function buildContext(chatId: string, personaId: string, maxChars: number) {
  const s = useChatStore.getState();
  const c = useConfigStore.getState();
  const chat = s.chats.find((x) => x.id === chatId);
  const all = s.messages[chatId] ?? [];
  const persona = c.personas.find((p) => p.id === personaId);

  const sysParts: string[] = [];
  if (persona?.system) sysParts.push(persona.system);

  const pinned = (chat as any)?.memories?.filter((m: any) => m?.pinned).map((m: any) => "- " + m.text) ?? [];
  if ((chat as any)?.summary || pinned.length) {
    const head: string[] = [];
    if ((chat as any)?.summary) head.push("Conversation summary:\n" + (chat as any).summary);
    if (pinned.length) head.push("Pinned facts about user/session:\n" + pinned.join("\n"));
    sysParts.push(head.join("\n\n"));
  }

  const system: ORMessage | null = sysParts.length
    ? { role: "system", content: sysParts.join("\n\n") }
    : null;

  let acc = (system?.content.length ?? 0);
  const collected: ORMessage[] = [];
  for (let i = all.length - 1; i >= 0; i--) {
    const m = all[i];
    if (!m) continue;
    const len = m.content.length + 20;
    if (acc + len > maxChars && collected.length > 0) break;
    collected.push({ role: m.role, content: m.content });
    acc += len;
  }
  collected.reverse();

  const messages: ORMessage[] = [];
  if (system) messages.push(system);
  messages.push(...collected);
  return { messages, approxTokens: approxTokensFromChars(acc) };
}
