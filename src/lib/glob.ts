/** Einfaches, case-insensitives Glob-Matching: * und ?  */
export function globMatch(pattern: string, value: string): boolean {
  if (!pattern) return false;
  const esc = (s: string) => s.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
  const re = "^" + esc(pattern).replace(/\\\*/g, ".*").replace(/\\\?/g, ".") + "$";
  try { return new RegExp(re, "i").test(value); } catch { return false; }
}

/** Mindestens ein Pattern passt (ODER) */
export function globAny(patterns: string[] | undefined, value: string): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some(p => globMatch(p, value));
}
