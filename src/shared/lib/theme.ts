export type Accent = "violet" | "amber" | "jade" | "blue";
const LS_KEY = "accent-theme";

const palettes: Record<Accent, string> = {
  violet: "262 84% 60%",
  amber: "38 96% 55%",
  jade: "160 90% 44%",
  blue: "216 98% 60%",
};

export function initAccent(defaultAccent: Accent) {
  const a = (localStorage.getItem(LS_KEY) as Accent) || defaultAccent;
  setAccent(a);
}

export function setAccent(a: Accent) {
  localStorage.setItem(LS_KEY, a);
  const root = document.documentElement;
  root.style.setProperty("--accent-600-hsl", palettes[a]);
  root.style.setProperty("--accent-600", palettes[a]);
}

export function getAccent(): Accent {
  return (localStorage.getItem(LS_KEY) as Accent) || "violet";
}
