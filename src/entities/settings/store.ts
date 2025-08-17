import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  apiKey: string | null;
  modelId: string | null;         // aktive Modell-ID
  styleId: string;                // aktiver Stil (id), Default "neutral"
  accent: string;                 // HEX, z. B. #D97706
  lang: string;                   // "de" | "en" ...
  setApiKey: (k: string | null) => void;
  setModelId: (id: string | null) => void;
  setStyleId: (id: string) => void;
  setAccent: (hex: string) => void;
  setLang: (code: string) => void;
  reset: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      modelId: null,
      styleId: "neutral",
      accent: "#D97706",
      lang: "de",
      setApiKey: (k) => set({ apiKey: (k || "").trim() || null }),
      setModelId: (id) => set({ modelId: id }),
      setStyleId: (id) => set({ styleId: id || "neutral" }),
      setAccent: (hex) => set({ accent: hex || "#D97706" }),
      setLang: (code) => set({ lang: code || "de" }),
      reset: () => set({ apiKey: null, modelId: null, styleId: "neutral", accent: "#D97706", lang: "de" })
    }),
    {
      name: "ai_chat_settings_v1",
      version: 1,
      partialize: (s) => ({
        apiKey: s.apiKey,
        modelId: s.modelId,
        styleId: s.styleId,
        accent: s.accent,
        lang: s.lang
      })
    }
  )
);
