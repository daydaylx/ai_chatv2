import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light";

type ConfigState = {
  theme: Theme;
  modelId: string;
  setTheme: (t: Theme) => void;
  setModelId: (id: string) => void;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      theme: "dark",
      modelId: "",
      setTheme: (t) => set({ theme: t }),
      setModelId: (modelId) => set({ modelId })
    }),
    {
      name: "config_store_v1",
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
);
