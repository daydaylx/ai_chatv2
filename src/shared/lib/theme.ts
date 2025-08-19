// Simple Theme helper: Accent lesen/schreiben + initial anwenden
export type Accent = "violet" | "amber" | "jade" | "blue";
const LS_KEY = "ui.accent";

export function initAccent(defaultAccent: Accent = "violet") {
  try {
    const stored = (localStorage.getItem(LS_KEY) as Accent | null) || null;
    const acc = stored ?? defaultAccent;
    document.documentElement.dataset.accent = acc;
  } catch {
    document.documentElement.dataset.accent = defaultAccent;
  }
}

export function setAccent(accent: Accent) {
  try { localStorage.setItem(LS_KEY, accent); } catch {}
  document.documentElement.dataset.accent = accent;
}

export function getAccent(defaultAccent: Accent = "violet"): Accent {
  const d = document.documentElement.dataset.accent as Accent | undefined;
  if (d) return d;
  try {
    const stored = (localStorage.getItem(LS_KEY) as Accent | null) || null;
    return stored ?? defaultAccent;
  } catch {
    return defaultAccent;
  }
}
