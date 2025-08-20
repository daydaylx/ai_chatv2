export type Accent = "violet" | "amber" | "jade" | "blue";
const LS_KEY = "ui.accent";

export function initAccent(defaultAccent: Accent = "violet") {
  const stored = safeRead(LS_KEY) as Accent | null;
  const acc = (stored ?? defaultAccent);
  document.documentElement.dataset.accent = acc;
}

export function setAccent(accent: Accent) {
  safeWrite(LS_KEY, accent);
  document.documentElement.dataset.accent = accent;
}

export function getAccent(fallback: Accent = "violet"): Accent {
  const d = (document.documentElement.dataset.accent as Accent | undefined);
  return d ?? (safeRead(LS_KEY) as Accent | null) ?? fallback;
}

function safeRead(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeWrite(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}
