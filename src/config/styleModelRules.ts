export type StyleRule = { allow?: string[]; deny?: string[]; };
const rules: Record<string, StyleRule> = {
  coding: { allow: ["mistral", "llama", "qwen", "deepseek"], deny: [] },
  neutral: {},
};
export function ruleForStyle(personaId: string | null): StyleRule | null {
  if (!personaId) return null;
  return rules[personaId] ?? null;
}
export function isModelAllowed(rule: StyleRule | null, id: string, text?: string): boolean {
  if (!rule) return true;
  const blob = [id, text ?? ""].join(" ").toLowerCase();
  if (rule.deny?.some(p => blob.includes(p.toLowerCase()))) return false;
  if (rule.allow?.length) return rule.allow.some(p => blob.includes(p.toLowerCase()));
  return true;
}
