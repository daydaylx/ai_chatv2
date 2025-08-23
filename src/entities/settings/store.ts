import { create } from "zustand";

type Favorites = Record<string, true>;

export type SettingsState = {
  modelId: string | null;
  favorites: Favorites;
  setModelId: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
};

const LS_MODEL = "settings.modelId";
const LS_FAVS = "settings.favorites";

function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, v: string | null) { try { v==null?localStorage.removeItem(key):localStorage.setItem(key,v);} catch{} }

export const useSettings = create<SettingsState>((set, get) => ({
  modelId: read(LS_MODEL),
  favorites: (() => {
    try { return JSON.parse(read(LS_FAVS) || "{}") as Favorites; } catch { return {}; }
  })(),
  setModelId: (id) => { set({ modelId: id }); write(LS_MODEL, id); },
  toggleFavorite: (id) => {
    const f = { ...get().favorites };
    if (f[id]) delete f[id]; else f[id] = true;
    set({ favorites: f }); write(LS_FAVS, JSON.stringify(f));
  },
}));
