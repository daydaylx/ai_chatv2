import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SettingsState = {
  modelId: string | null;
  personaId: string | null;
  language: "de" | "en";
  setModelId: (id: string | null) => void;
  setPersonaId: (id: string | null) => void;
  setLanguage: (l: "de" | "en") => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      modelId: null,
      personaId: "neutral",
      language: "de",
      setModelId: (id) => set({ modelId: id }),
      setPersonaId: (id) => set({ personaId: id }),
      setLanguage: (l) => set({ language: l })
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
