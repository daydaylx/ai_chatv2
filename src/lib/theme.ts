export type ThemeId = "light" | "dark" | "red" | "blue" | "purple";

export type Theme = {
  id: ThemeId;
  name: string;
  vars: Record<string, string>;
};

const THEMES: Record<ThemeId, Theme> = {
  light: {
    id: "light",
    name: "Hell",
    vars: {
      "--bg": "#f7f9fc",
      "--bg-secondary": "#ffffff", 
      "--fg": "#0b0f14",
      "--text-secondary": "#6b7280",
      "--accent": "#3b82f6",
      "--accent-bg": "#dbeafe",
      "--border-color": "#e5e7eb",
      "--shadow": "rgba(0,0,0,0.1)"
    }
  },
  dark: {
    id: "dark", 
    name: "Dunkel",
    vars: {
      "--bg": "#0b0f14",
      "--bg-secondary": "#1a1f2e",
      "--fg": "#e6edf3", 
      "--text-secondary": "#8b949e",
      "--accent": "#8b5cf6",
      "--accent-bg": "#2d1b69",
      "--border-color": "#30363d",
      "--shadow": "rgba(0,0,0,0.3)"
    }
  },
  red: {
    id: "red",
    name: "Rot (Adult)",
    vars: {
      "--bg": "#120b0c",
      "--bg-secondary": "#2d1314", 
      "--fg": "#ffecec",
      "--text-secondary": "#d1a3a4",
      "--accent": "#ef4444",
      "--accent-bg": "#7f1d1d",
      "--border-color": "#44181c",
      "--shadow": "rgba(239,68,68,0.2)"
    }
  },
  blue: {
    id: "blue",
    name: "Blau (Roleplay)",
    vars: {
      "--bg": "#0b1016", 
      "--bg-secondary": "#1e293b",
      "--fg": "#e5f0ff",
      "--text-secondary": "#94a3b8",
      "--accent": "#3b82f6",
      "--accent-bg": "#1e40af", 
      "--border-color": "#334155",
      "--shadow": "rgba(59,130,246,0.2)"
    }
  },
  purple: {
    id: "purple",
    name: "Lila (Kreativ)",
    vars: {
      "--bg": "#120f16",
      "--bg-secondary": "#2d1b3d", 
      "--fg": "#efe9ff",
      "--text-secondary": "#c4b5fd",
      "--accent": "#8b5cf6",
      "--accent-bg": "#6d28d9",
      "--border-color": "#4c1d95", 
      "--shadow": "rgba(139,92,246,0.2)"
    }
  }
};

export function applyTheme(themeId: ThemeId = "dark"): void {
  const theme = THEMES[themeId];
  if (!theme) {
    console.warn(`Theme '${themeId}' not found, falling back to 'dark'`);
    return applyTheme("dark");
  }
  
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  
  // CSS Custom Properties setzen
  Object.entries(theme.vars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Persistierung mit Error-Handling
  try {
    localStorage.setItem("theme", themeId);
  } catch (error) {
    console.warn("Failed to persist theme:", error);
  }
}

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme") as ThemeId;
    if (stored && THEMES[stored]) {
      return THEMES[stored];
    }
  } catch (error) {
    console.warn("Failed to load theme from storage:", error);
  }
  
  return THEMES.dark; // Produktionssicherer Default
}

export function setTheme(themeId: ThemeId): void {
  applyTheme(themeId);
}

export function getAllThemes(): Theme[] {
  return Object.values(THEMES);
}

export { THEMES };
