import { create } from "zustand";
import type { OpenRouterModel } from "../../lib/openrouter";

export type Persona = {
  id: string;
  label: string;
  description?: string;
  system: string;
};

type ConfigState = {
  personas: Persona[];
  models: OpenRouterModel[];
  loaded: boolean;
  loading: boolean;
  error?: string;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  getPersonaById: (id: string) => Persona | undefined;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`${url}: ${resp.status}`);
  return (await resp.json()) as T;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  personas: [],
  models: [],
  loaded: false,
  loading: false,

  async load() {
    if (get().loading || get().loaded) return;
    set({ loading: true, error: undefined });
    try {
      const [personas, models] = await Promise.all([
        fetchJSON<Persona[]>("/personas.json"),
        fetchJSON<OpenRouterModel[]>("/models.json")
      ]);
      set({ personas, models, loaded: true, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      // Bei Fehler: minimaler Fallback
      set({
        personas: [
          { id: "neutral", label: "Neutral", system: "You are a concise, neutral assistant." }
        ],
        models: [{ id: "openai/gpt-4o-mini", name: "GPT-4o mini", vendor: "openai", context_length: 128000 }]
      });
    }
  },

  async reload() {
    set({ loaded: false });
    await get().load();
  },

  getPersonaById(id) {
    return get().personas.find(p => p.id === id);
  }
}));
