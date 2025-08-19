import type { ChatMessage } from "./openrouter";
import type { MemoryEntry, MemoryState } from "../entities/memory/store";

/** Baut den Inhalt der 2. System-Nachricht aus Memory-Einträgen */
export function buildMemorySystemContent(entries: MemoryEntry[]): string {
  const top = [...entries]
    .sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0))
    .slice(0, 8);

  const lines = top.map((e) => {
    const tags = e.tags?.length ? ` [${e.tags.slice(0, 3).join(", ")}]` : "";
    const text = e.text.length > 240 ? e.text.slice(0, 237) + "…" : e.text;
    return `- ${text}${tags}`;
  });

  return `Kontextnotizen (nur lokal, vom Nutzer gepflegt):\n${lines.join("\n")}`;
}

/**
 * Injiziert Memory hinter den Stil (messages[0]) und kürzt notfalls alte History.
 * Index-Zugriffe sind strikt abgesichert für noUncheckedIndexedAccess.
 */
export function injectMemory(
  messages: ChatMessage[],
  memory: MemoryState,
  opts?: { maxChars?: number }
): ChatMessage[] {
  if (!memory.enabled || !memory.entries.length) return messages;

  const first = messages.at(0);
  if (!first) return messages; // keine Stil-Message => nichts tun

  const memText = buildMemorySystemContent(memory.entries);
  const memMsg: ChatMessage = { role: "system", content: memText };

  // Neu zusammensetzen ohne unsichere Indexe
  const out: ChatMessage[] = [first, memMsg];
  for (let i = 1; i < messages.length; i++) {
    const m = messages[i];
    if (m) out.push(m);
  }

  // Budget-grobe Kürzung nach Zeichen (kein Tokenizer)
  const maxChars = opts?.maxChars ?? 12000; // ~3k Tokens grob
  const size = () =>
    out.reduce((n, m) => n + String((m as ChatMessage).content ?? "").length + 16, 0);

  if (size() > maxChars) {
    // ab Index 2 (nach Stil + Memory) nur user/assistant schneiden
    let i = 2;
    while (i < out.length - 1 && size() > maxChars) {
      const msg = out[i];
      if (msg && (msg.role === "user" || msg.role === "assistant")) {
        out.splice(i, 1);
        continue; // gleicher Index erneut prüfen (Liste ist geschrumpft)
      }
      i++;
    }
  }

  return out;
}
