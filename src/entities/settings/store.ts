import { create } from "zustand";

type Favorites = Record<string, true>;

export type SettingsState = {
  /** Ausgewähltes Inferenzmodell */
  modelId: string | null;
  /** Favoritenliste von Modell-IDs */
  favorites: Favorites;

  /** Ausgewählter Stil (Persona) */
  personaId: string | null;

  /** Auto-Funktionen */
  autoSummarize: boolean;
  autoMemory: boolean;
  summarizerModelId: string | null;

  setModelId: (id: string | null) => void;
  toggleFavorite: (id: string) => void;

  setPersonaId: (id: string | null) => void;

  setAutoSummarize: (v: boolean) => void;
  setAutoMemory: (v: boolean) => void;
  setSummarizerModelId: (id: string | null) => void;
};

const LS = {
  MODEL: "settings.modelId",
  FAVS:  "settings.favorites",
  PERSONA: "settings.personaId",
  AUTO_SUM: "settings.autoSummarize",
  AUTO_MEM: "settings.autoMemory",
  SUM_MODEL: "settings.summarizerModelId",
};

function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, v: string | null) { try { v==null?localStorage.removeItem(key):localStorage.setItem(key,v);} catch{} }

export const useSettings = create<SettingsState>((set, get) => ({
  modelId: read(LS.MODEL),
  favorites: (() => { try { return JSON.parse(read(LS.FAVS) || "{}") as Favorites; } catch { return {}; }})(),
  personaId: read(LS.PERSONA),

  autoSummarize: read(LS.AUTO_SUM) === "1",
  autoMemory: read(LS.AUTO_MEM) === "1",
  summarizerModelId: read(LS.SUM_MODEL),

  setModelId: (id) => { set({ modelId: id }); write(LS.MODEL, id); },
  toggleFavorite: (id) => {
    const f = { ...get().favorites };
    if (f[id]) delete f[id]; else f[id] = true;
    set({ favorites: f }); write(LS.FAVS, JSON.stringify(f));
  },

  setPersonaId: (id) => { set({ personaId: id }); write(LS.PERSONA, id); },

  setAutoSummarize: (v) => { set({ autoSummarize: v }); write(LS.AUTO_SUM, v ? "1" : "0"); },
  setAutoMemory: (v) => { set({ autoMemory: v }); write(LS.AUTO_MEM, v ? "1" : "0"); },
  setSummarizerModelId: (id) => { set({ summarizerModelId: id }); write(LS.SUM_MODEL, id); },
}));
