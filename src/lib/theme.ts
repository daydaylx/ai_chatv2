export type ThemeId = "neon" | "mint" | "sunset" | "grape" | "mono";

type ThemeDef = {
  id: ThemeId;
  label: string;
  vars: Record<string, string>;
};

const KEY = "ui_theme";

export const THEMES: ThemeDef[] = [
  {
    id: "neon",
    label: "Neon Blue",
    vars: {
      "--accent": "#1a73e8",
      "--accent-2": "#4cc9f0",
      "--bg-grad-1": "#0b0f14",
      "--bg-grad-2": "#0a1220"
    }
  },
  {
    id: "mint",
    label: "Neo Mint",
    vars: {
      "--accent": "#1dd1a1",
      "--accent-2": "#48dbfb",
      "--bg-grad-1": "#071511",
      "--bg-grad-2": "#041a17"
    }
  },
  {
    id: "sunset",
    label: "Sunset",
    vars: {
      "--accent": "#f97316",
      "--accent-2": "#f43f5e",
      "--bg-grad-1": "#150c0b",
      "--bg-grad-2": "#1e0f0a"
    }
  },
  {
    id: "grape",
    label: "Cyber Grape",
    vars: {
      "--accent": "#7c3aed",
      "--accent-2": "#22d3ee",
      "--bg-grad-1": "#0f0b14",
      "--bg-grad-2": "#130a1e"
    }
  },
  {
    id: "mono",
    label: "Monochrome",
    vars: {
      "--accent": "#8b949e",
      "--accent-2": "#c9d1d9",
      "--bg-grad-1": "#0b0f14",
      "--bg-grad-2": "#0b0f14"
    }
  }
];

export function getTheme(): ThemeDef {
  const id = (localStorage.getItem(KEY) as ThemeId) || "neon";
  return THEMES.find(t => t.id === id) || THEMES[0];
}

export function setTheme(id: ThemeId) {
  const t = THEMES.find(x => x.id === id);
  if (!t) return;
  localStorage.setItem(KEY, t.id);
  applyTheme(t);
}

export function applyTheme(t: ThemeDef = getTheme()) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
}
