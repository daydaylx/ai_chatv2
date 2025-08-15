import type { ChatMessage as ORMessage } from "./openrouter";
import { PRESETS } from "./presets";
import { useChatStore } from "../entities/chat/store";

/** grob: 1 Token ~ 4 Zeichen */
export function approxTokensFromChars(chars: number) {
  return Math.ceil(chars / 4);
}

/** Kontext-Messages (Summary + pinned Memories + System + letzte Messages) */
export function buildContext(chatId: string, personaId: string, maxChars: number) {
  const s = useChatStore.getState();
  const chat = s.chats.find((c) => c.id === chatId);
  const all = s.messages[chatId] ?? [];
  const preset = PRESETS.find((p) => p.id === personaId);

  const sysParts: string[] = [];
  if (preset?.system) sysParts.push(preset.system);

  const pinned = (chat?.memories ?? []).filter((m) => m.pinned).map((m) => "- " + m.text);
  if (chat?.summary || pinned.length) {
    const head: string[] = [];
    if (chat?.summary) head.push("Conversation summary:\n" + chat.summary);
    if (pinned.length) head.push("Pinned facts about user/session:\n" + pinned.join("\n"));
    sysParts.push(head.join("\n\n"));
  }

  const system: ORMessage | null = sysParts.length
    ? { role: "system", content: sysParts.join("\n\n") }
    : null;

  // von hinten (neueste) sammeln, bis maxChars erreicht
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

/** ggf. Zusammenfassen */
export async function maybeSummarize(chatId: string, client: { chat: Function }) {
  const s = useChatStore.getState();
  const { summarizeAfterChars } = s.settings;
  const all = s.messages[chatId] ?? [];
  const totalChars = all.reduce((n, m) => n + (m?.content?.length ?? 0) + 20, 0);
  if (totalChars < summarizeAfterChars) return;

  const keepLast = 8;
  const older = all.slice(0, Math.max(0, all.length - keepLast));
  if (!older.length) return;

  const text = older.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const prompt =
    "Fasse den obigen Chatverlauf prägnant zusammen. Bulletpoints für Fakten über Nutzer/Session sind ok. Max. ~1200 Zeichen.";

  const res: any = await (client as any).chat({
    model: s.chats.find((c) => c.id === chatId)?.modelId || "openai/gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 600,
    messages: [
      { role: "system", content: "You are a concise meeting/chat summarizer." },
      { role: "user", content: prompt + "\n\n---\n" + text },
    ],
  });

  const sum = (res?.content ?? "").trim();
  if (sum) {
    useChatStore.getState().setChatSummary(chatId, sum);
  }
}

/** einfache Memory-Extraktion (tolerant) */
export async function maybeExtractMemories(chatId: string, client: { chat: Function }) {
  const s = useChatStore.getState();
  if (!s.settings.memAuto) return;

  const all = s.messages[chatId] ?? [];
  const lastUser = [...all].reverse().find((m) => m.role === "user");
  if (!lastUser) return;

  const res: any = await (client as any).chat({
    model: s.chats.find((c) => c.id === chatId)?.modelId || "openai/gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      { role: "system", content: "Extract brief, evergreen facts about the user/session as JSON array of strings. Only include useful, non-sensitive facts. If none, return []" },
      { role: "user", content: lastUser.content },
    ],
  });

  try {
    const txt = (res?.content ?? "").trim();
    const arr = JSON.parse(txt) as string[];
    if (Array.isArray(arr)) {
      arr.slice(0, 4).forEach((text) => {
        if (typeof text === "string" && text.trim()) {
          useChatStore.getState().addMemory(chatId, { text: text.trim(), pinned: false });
        }
      });
    }
  } catch {
    /* ignore non-JSON */
  }
}
