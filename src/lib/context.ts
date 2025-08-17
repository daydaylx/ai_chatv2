import { estimateTokensForMessages, type ChatMessage } from "./token";
import type { AccSummary } from "../entities/summary/store";
import { policyForModel, loadContextPolicy, type ContextPolicy } from "./contextPolicy";

export async function buildPrompt(params: {
  modelId: string;
  baseSystem: string;
  styleSystem: string;
  fullHistory: ChatMessage[]; // inkl. aktueller User-Nachricht am Ende
  summary: AccSummary | null;
}): Promise<{ messages: ChatMessage[]; policy: ContextPolicy; breakdown: { system: number; summary: number; tail: number } }> {
  const base = await loadContextPolicy();
  const pol = policyForModel(base, params.modelId);

  const sys: ChatMessage[] = [];
  if (params.baseSystem?.trim()) sys.push({ role: "system", content: params.baseSystem.trim() });
  if (params.styleSystem?.trim()) sys.push({ role: "system", content: params.styleSystem.trim() });

  let sumMsgs: ChatMessage[] = [];
  if (params.summary?.text?.trim()) {
    sumMsgs = [{ role: "system", content: `Conversation recap (bis Turn ${params.summary.covered_until_turn}):\n${params.summary.text.trim()}` }];
  }

  const tail = params.fullHistory.slice(-pol.rawTurns);
  const messages = [...sys, ...sumMsgs, ...tail];

  const breakdown = {
    system: estimateTokensForMessages(sys),
    summary: estimateTokensForMessages(sumMsgs),
    tail: estimateTokensForMessages(tail)
  };

  return { messages, policy: pol, breakdown };
}
