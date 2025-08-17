export type ChatMessage = { role: "system"|"user"|"assistant"; content: string };

/** konservativ: ~4 Zeichen/Token + 10% Puffer */
export function estimateTokensForText(s: string): number {
  if (!s) return 0;
  const rough = Math.ceil(s.length / 4);
  return Math.ceil(rough * 1.1);
}

export function estimateTokensForMessages(msgs: ChatMessage[]): number {
  return msgs.reduce((sum, m) => sum + estimateTokensForText(m.content), 0);
}
