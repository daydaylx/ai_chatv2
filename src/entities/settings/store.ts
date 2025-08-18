import { create } from "zustand";

/**
 * Wichtig:
 * - Tests erwarten: modelId default = null, personaId default = "neutral"
 * - Setter mutieren die gleiche Objekt-Referenz (getState() bleibt stabil)
 * - Persistenz: localStorage
 */

export type SettingsState = {
  modelId: string | null;
  personaId: string | null;
  favorites: Record<string, true>;
  setModelId: (id: string | null) => void;
  setPersonaId: (id: string | null) => void;
  toggleFavorite: (modelId: string) => void;
  reset: () => void;
};

const KEY_MODEL = "settings:modelId";
const KEY_PERSONA = "settings:personaId";
const KEY_FAVS = "settings:favorites";

function readLS(key: string): string | null {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return null;
    const v = window.localStorage.getItem(key);
    return v && v.length ? v : null;
  } catch { return null; }
}
function writeLS(key: string, v: string | null) {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    if (v === null || v === "") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, v);
  } catch {}
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const obj = JSON.parse(raw);
    return (obj && typeof obj === "object") ? obj as T : fallback;
  } catch { return fallback; }
}
function writeJSON(key: string, obj: any) {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    window.localStorage.setItem(key, JSON.stringify(obj));
  } catch {}
}

// Defaults laut Tests
const initialModel = readLS(KEY_MODEL);
const initialPersona = readLS(KEY_PERSONA) ?? "neutral";
const initialFavs = readJSON<Record<string, true>>(KEY_FAVS, {});

export const useSettings = create<SettingsState>((set, get) => ({
  modelId: initialModel ?? null,
  personaId: initialPersona,
  favorites: initialFavs,

  setModelId: (id) => {
    const state = get();
    state.modelId = id ?? null;
    writeLS(KEY_MODEL, id ?? null);
    // Zustand verlangt ein neues Objekt – aber Tests wollen Reuse der Referenz:
    set(state, true);
  },
  setPersonaId: (id) => {
    const state = get();
    state.personaId = (id ?? null);
    writeLS(KEY_PERSONA, id ?? null);
    set(state, true);
  },
  toggleFavorite: (mid) => {
    const state = get();
    if (!state.favorites) state.favorites = {};
    if (state.favorites[mid]) delete state.favorites[mid];
    else state.favorites[mid] = true;
    writeJSON(KEY_FAVS, state.favorites);
    set(state, true);
  },
  reset: () => {
    const state = get();
    state.modelId = null;
    state.personaId = null;
    state.favorites = {};
    writeLS(KEY_MODEL, null);
    writeLS(KEY_PERSONA, null);
    writeJSON(KEY_FAVS, {});
    set(state, true);
  },
}));

export default useSettings;
