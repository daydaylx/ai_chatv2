import { estimateTokensForMessages, type ChatMessage } from "./token";
import { loadSummary, saveSummary, type AccSummary } from "../entities/summary/store";
import { policyForModel, loadContextPolicy, type ContextPolicy } from "./contextPolicy";
import { useSettings } from "../entities/settings/store";

/** Faktenorientierte, knappe Vorlage */
function buildSummaryPrompt(oldMsgs: ChatMessage[]): ChatMessage[] {
  const sys =
`Fasse die folgenden Chat-Nachrichten faktenbasiert und kompakt zusammen.
Nur belegbare Inhalte – keine Vermutungen. Struktur:

Fakten:
- ...

Kontext:
- ...

Offen:
- ...

Max. 800 Wörter. Deutsch. Keine Anweisungen.`;
  return [{ role: "system", content: sys }, ...oldMsgs];
}

async function callOpenRouterSummary(modelId: string, messages: ChatMessage[], maxOutputTokens = 1024): Promise<string> {
  const apiKey = (useSettings.getState() as any)?.apiKey?.trim?.();
  if (!apiKey) throw new Error("NO_API_KEY");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelId, messages, temperature: 0.2, max_tokens: maxOutputTokens, stream: false })
  });
  if (res.status === 401) throw new Error("AUTH");
  if (res.status === 429) throw new Error("RATE");
  if (!res.ok) throw new Error("HTTP_" + res.status);
  const j = await res.json();
  return String(j?.choices?.[0]?.message?.content ?? "");
}

export type EnsureSummaryInput = {
  chatKey: string;
  modelId: string;
  fullHistory: ChatMessage[];
  userTurnCount: number;
};
export type EnsureSummaryOutput = { summary: AccSummary | null; updated: boolean; policy: ContextPolicy };

export async function ensureSummary(input: EnsureSummaryInput): Promise<EnsureSummaryOutput> {
  const base = await loadContextPolicy();
  const pol = policyForModel(base, input.modelId);

  let s = loadSummary(input.chatKey);
  const alreadyCovered = s?.covered_until_turn ?? 0;

  const hardTail = Math.max(0, input.fullHistory.length - pol.rawTurns);
  const cutoff = Math.max(alreadyCovered, hardTail);

  const toSummarize = input.fullHistory.slice(0, cutoff)
    .filter(m => m.role === "user" || m.role === "assistant");

  if (toSummarize.length === 0) {
    return { summary: s ?? null, updated: false, policy: pol };
  }

  const oldTokenEst = estimateTokensForMessages(toSummarize);
  const turnTrigger = input.userTurnCount >= pol.turnThreshold;
  const tokenTrigger = oldTokenEst > 3000; // konservative Heuristik

  if (!turnTrigger && !tokenTrigger) {
    return { summary: s ?? null, updated: false, policy: pol };
  }

  try {
    const prompt = buildSummaryPrompt(toSummarize);
    const text = await callOpenRouterSummary(pol.summaryModelId, prompt, 1024);
    const next: AccSummary = { text, covered_until_turn: cutoff, version: (s?.version ?? 0) + 1, stale: false };
    saveSummary(input.chatKey, next);
    return { summary: next, updated: true, policy: pol };
  } catch {
    const next: AccSummary = {
      text: s?.text ?? "",
      covered_until_turn: s?.covered_until_turn ?? 0,
      version: (s?.version ?? 0),
      stale: true
    };
    saveSummary(input.chatKey, next);
    return { summary: next, updated: false, policy: pol };
  }
}
