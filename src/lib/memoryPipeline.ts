import type { ChatMessage } from "./openrouter";
import type { MemoryEntry, MemoryState } from "../entities/memory/store";

export function buildMemorySystemContent(entries: MemoryEntry[]): string {
  const top = [...entries].sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0)).slice(0, 8);
  const lines = top.map(e => {
    const tags = e.tags?.length ? ` [${e.tags.slice(0,3).join(", ")}]` : "";
    const text = e.text.length > 240 ? e.text.slice(0, 237) + "…" : e.text;
    return `- ${text}${tags}`;
  });
  return `Kontextnotizen (nur lokal, vom Nutzer gepflegt):\n${lines.join("\n")}`;
}

export function injectMemory(messages: ChatMessage[], memory: MemoryState, opts?: { maxChars?: number }): ChatMessage[] {
  if (!memory.enabled || !memory.entries.length) return messages;
  const memText = buildMemorySystemContent(memory.entries);
  const memMsg: ChatMessage = { role: "system", content: memText };

  if (messages.length === 0) return messages;

  const out: ChatMessage[] = [];
  out.push(messages[0]); // Stil unverändert an Position 0
  out.push(memMsg);      // 2. System-Nachricht
  for (let i = 1; i < messages.length; i++) out.push(messages[i]);

  const maxChars = opts?.maxChars ?? 12000;
  const size = () => out.reduce((n, m) => n + String(m.content ?? "").length + 16, 0);

  if (size() > maxChars) {
    for (let i = 2; i < out.length - 1 && size() > maxChars; i++) {
      if (out[i].role === "user" || out[i].role === "assistant") {
        out.splice(i, 1);
        i--;
      }
    }
  }
  return out;
}
