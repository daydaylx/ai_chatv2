/**
 * Stil-Regeln für zugelassene/verbotene Modelle.
 * Du kannst hier pro Stil ID einfache Patterns hinterlegen.
 * - allow: Wenn gesetzt, MUSS mind. 1 Pattern matchen.
 * - deny:  Wenn eines matcht, ist das Modell ausgeschlossen.
 *
 * Pattern-Syntax:
 * - String als Wildcard ("gpt-*", "claude*code*")
 * - RegExp via /.../i
 */

export type StyleRule = {
  styleId: string;
  allow?: Array<string | RegExp>;
  deny?: Array<string | RegExp>;
};

/** Beispiel-/Default-Regeln: Passe sie an deine Stil-IDs an. */
const RULES: StyleRule[] = [
  // Neutral: keine Einschränkungen
  { styleId: "neutral" },

  // Beispiel: "coding" bevorzugt Code-orientierte Modelle
  {
    styleId: "coding",
    allow: ["*code*", "*coder*", "/(deepseek|sonnet).*?code/i"],
    deny: [],
  },

  // Beispiel: "creative" – alles ok, außer NSFW-Sondermodelle
  {
    styleId: "creative",
    deny: ["/nsfw|uncensored/i"],
  },
];

export function ruleForStyle(styleId: string | null | undefined): StyleRule | null {
  if (!styleId) return null;
  return RULES.find((r) => r.styleId === styleId) ?? null;
}

export function isModelAllowed(rule: StyleRule | null, modelId: string, label?: string | null): boolean {
  if (!rule) return true;
  const hay = `${modelId} ${label ?? ""}`.toLowerCase();
  // deny gewinnt immer
  if (rule.deny?.length && rule.deny.some((p) => match(hay, p))) return false;
  // allow: wenn existiert, muss mind. eines matchen
  if (rule.allow?.length) return rule.allow.some((p) => match(hay, p));
  return true;
}

function match(hay: string, pat: string | RegExp): boolean {
  if (pat instanceof RegExp) return pat.test(hay);
  const rx = wildcardToRegExp(pat);
  return rx.test(hay);
}

function wildcardToRegExp(pat: string): RegExp {
  // Escapen und * → .*
  const esc = pat.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${esc}$`, "i");
}
