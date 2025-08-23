import { create } from "zustand";

// Storage-Keys
const KEY_MODEL = "settings:modelId";
const KEY_PERSONA = "settings:personaId";
const KEY_FAVS = "settings:favorites";
const KEY_AUTO_SUM = "settings:autoSummarize";
const KEY_AUTO_MEM = "settings:autoMemory";
const KEY_SUM_MODEL = "settings:summarizerModelId";

// Safe LS Helpers
function readLS(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeLS(key: string, v: string | null) {
  try {
    if (v == null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch { /* noop */ }
}
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const obj = JSON.parse(raw);
    return (obj && typeof obj === "object") ? obj as T : fallback;
  } catch { return fallback; }
}
function writeJSON(key: string, obj: any) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch { /* noop */ }
}

// ---- State-Typ (kompatibel zu Tests/SettingsSheet) ----
export type SettingsState = {
  modelId: string | null;
  personaId: string | null;
  favorites: Record<string, true>;

  // Memory/Summary-Optionen
  autoSummarize: boolean;
  autoMemory: boolean;
  summarizerModelId: string | null;

  // Actions
  setModelId: (id: string | null) => void;
  setPersonaId: (id: string | null) => void;
  toggleFavorite: (modelId: string) => void;

  setAutoSummarize: (on: boolean) => void;
  setAutoMemory: (on: boolean) => void;
  setSummarizerModelId: (id: string | null) => void;

  reset: () => void;
};

// ---- Defaults (Tests erwarten personaId = "neutral") ----
const initial: Pick<SettingsState,
  "modelId" | "personaId" | "favorites" | "autoSummarize" | "autoMemory" | "summarizerModelId"
> = {
  modelId: readLS(KEY_MODEL),
  personaId: readLS(KEY_PERSONA) ?? "neutral",
  favorites: readJSON<Record<string, true>>(KEY_FAVS, {}),
  autoSummarize: readLS(KEY_AUTO_SUM) === "1",
  autoMemory: readLS(KEY_AUTO_MEM) !== "0", // default: true
  summarizerModelId: readLS(KEY_SUM_MODEL),
};

export const useSettings = create<SettingsState>((set, get) => ({
  ...initial,

  setModelId: (id) => {
    writeLS(KEY_MODEL, id);
    set(s => ({ ...s, modelId: id ?? null }));
  },

  setPersonaId: (id) => {
    writeLS(KEY_PERSONA, id);
    set(s => ({ ...s, personaId: id ?? null }));
  },

  toggleFavorite: (mid) => {
    set(s => {
      const next = { ...(s.favorites || {}) };
      if (next[mid]) delete next[mid]; else next[mid] = true;
      writeJSON(KEY_FAVS, next);
      return { ...s, favorites: next };
    });
  },

  setAutoSummarize: (on) => {
    writeLS(KEY_AUTO_SUM, on ? "1" : "0");
    set(s => ({ ...s, autoSummarize: !!on }));
  },

  setAutoMemory: (on) => {
    writeLS(KEY_AUTO_MEM, on ? "1" : "0");
    set(s => ({ ...s, autoMemory: !!on }));
  },

  setSummarizerModelId: (id) => {
    writeLS(KEY_SUM_MODEL, id);
    set(s => ({ ...s, summarizerModelId: id ?? null }));
  },

  reset: () => {
    writeLS(KEY_MODEL, null);
    writeLS(KEY_PERSONA, null);
    writeJSON(KEY_FAVS, {});
    writeLS(KEY_AUTO_SUM, "0");
    writeLS(KEY_AUTO_MEM, "1");
    writeLS(KEY_SUM_MODEL, null);
    set({
      modelId: null,
      personaId: null, // Tests setzen danach selbst wieder auf "neutral", daher hier neutral/nullable ok
      favorites: {},
      autoSummarize: false,
      autoMemory: true,
      summarizerModelId: null,
      setModelId: get().setModelId,
      setPersonaId: get().setPersonaId,
      toggleFavorite: get().toggleFavorite,
      setAutoSummarize: get().setAutoSummarize,
      setAutoMemory: get().setAutoMemory,
      setSummarizerModelId: get().setSummarizerModelId,
      reset: get().reset,
    });
  },
}));

export default useSettings;
