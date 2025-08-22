import { create } from "zustand";

type Settings = {
  modelId: string | null;
  summarizerModelId: string | null;
  personaId: string | null;
  autoSummarize: boolean;
  autoMemory: boolean;

  setModelId: (id: string | null) => void;
  setSummarizerModelId: (id: string | null) => void;
  setPersonaId: (id: string | null) => void;
  setAutoSummarize: (v: boolean) => void;
  setAutoMemory: (v: boolean) => void;
};

const LS_KEY = "settings_v1";

const load = (): Partial<Settings> => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
};

export const useSettings = create<Settings>((set, get) => ({
  modelId: null,
  summarizerModelId: null,
  personaId: "neutral",
  autoSummarize: true,
  autoMemory: true,

  setModelId: (id) => { set({ modelId: id }); persist(); },
  setSummarizerModelId: (id) => { set({ summarizerModelId: id }); persist(); },
  setPersonaId: (id) => { set({ personaId: id }); persist(); },
  setAutoSummarize: (v) => { set({ autoSummarize: v }); persist(); },
  setAutoMemory: (v) => { set({ autoMemory: v }); persist(); },
  ...load(),
}));

function persist() {
  const s = useSettings.getState();
  localStorage.setItem(LS_KEY, JSON.stringify({
    modelId: s.modelId,
    summarizerModelId: s.summarizerModelId,
    personaId: s.personaId,
    autoSummarize: s.autoSummarize,
    autoMemory: s.autoMemory,
  }));
}
