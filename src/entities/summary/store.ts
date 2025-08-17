export type AccSummary = {
  text: string;
  covered_until_turn: number;
  version: number;
  stale: boolean;
};

const LS_KEY_PREFIX = "chat_summary_v1:";

export function loadSummary(chatKey: string): AccSummary | null {
  try {
    const raw = localStorage.getItem(LS_KEY_PREFIX + chatKey);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (typeof j?.text !== "string") return null;
    return {
      text: j.text,
      covered_until_turn: Number(j.covered_until_turn) || 0,
      version: Number(j.version) || 1,
      stale: !!j.stale
    };
  } catch {
    return null;
  }
}

export function saveSummary(chatKey: string, s: AccSummary): void {
  try { localStorage.setItem(LS_KEY_PREFIX + chatKey, JSON.stringify(s)); } catch {}
}

export function bumpSummaryVersion(chatKey: string): AccSummary {
  const cur = loadSummary(chatKey);
  const next: AccSummary = {
    text: cur?.text ?? "",
    covered_until_turn: cur?.covered_until_turn ?? 0,
    version: (cur?.version ?? 0) + 1,
    stale: true
  };
  saveSummary(chatKey, next);
  return next;
}
