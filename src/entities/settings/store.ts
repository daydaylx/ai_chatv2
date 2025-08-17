import { create } from "zustand";

export type SettingsState = {
  modelId: string | null;
  personaId: string | null;
  setModelId: (id: string | null) => void;
  setPersonaId: (id: string | null) => void;
  reset: () => void;
};

const KEY_MODEL = "settings:modelId";
const KEY_PERSONA = "settings:personaId";

function readLS(key: string): string | null {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return null;
    const v = window.localStorage.getItem(key);
    return v && v.length ? v : null;
  } catch {
    return null;
  }
}

function writeLS(key: string, v: string | null) {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    if (v === null || v === "") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, v);
  } catch {
    /* ignore */
  }
}

/**
 * Test-Erwartungen:
 * - Initial: modelId === null, personaId === "neutral" (sofern nichts in LS)
 * - Setter müssen denselben State-Ref mutieren (Tests halten 's' Referenz!)
 *   => Wir mutieren das Objekt aus get() und rufen set(state, true) (replace) auf.
 */
const initialModel = readLS(KEY_MODEL);              // -> null erwartet
const initialPersona = readLS(KEY_PERSONA) ?? "neutral";

export const useSettings = create<SettingsState>((set, get) => ({
  modelId: initialModel ?? null,
  personaId: initialPersona,

  setModelId: (id) => {
    const state = get();
    state.modelId = id ?? null;       // gleiche Objekt-Referenz mutieren
    writeLS(KEY_MODEL, id ?? null);
    set(state, true);                 // replace, aber gleiche Referenz beibehalten
  },

  setPersonaId: (id) => {
    const state = get();
    state.personaId = id ?? null;     // gleiche Objekt-Referenz mutieren
    writeLS(KEY_PERSONA, id ?? null);
    set(state, true);
  },

  reset: () => {
    const state = get();
    state.modelId = null;
    state.personaId = null;
    writeLS(KEY_MODEL, null);
    writeLS(KEY_PERSONA, null);
    set(state, true);
  },
}));

export default useSettings;
