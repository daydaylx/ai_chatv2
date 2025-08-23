import { create, type StateCreator } from "zustand";

export type SettingsState = {
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

function load(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw);
    // Nur die primitiven Felder zulassen
    return {
      modelId: j.modelId ?? null,
      summarizerModelId: j.summarizerModelId ?? null,
      personaId: j.personaId ?? "neutral",
      autoSummarize: typeof j.autoSummarize === "boolean" ? j.autoSummarize : true,
      autoMemory: typeof j.autoMemory === "boolean" ? j.autoMemory : true,
    };
  } catch {
    return {};
  }
}

function persistState(s: SettingsState) {
  const out = {
    modelId: s.modelId,
    summarizerModelId: s.summarizerModelId,
    personaId: s.personaId,
    autoSummarize: s.autoSummarize,
    autoMemory: s.autoMemory,
  };
  try { localStorage.setItem(LS_KEY, JSON.stringify(out)); } catch { /* ignore */ }
}

const initialPrimitives: Omit<SettingsState,
  "setModelId" | "setSummarizerModelId" | "setPersonaId" | "setAutoSummarize" | "setAutoMemory"
> = {
  modelId: null,
  summarizerModelId: null,
  personaId: "neutral",
  autoSummarize: true,
  autoMemory: true,
};

const creator: StateCreator<SettingsState, [], [], SettingsState> = (set, get) => {
  const persisted = load();
  const base = { ...initialPrimitives, ...persisted };

  return {
    ...base,

    setModelId: (id: string | null) => {
      set({ modelId: id });
      persistState({ ...get(), modelId: id });
    },

    setSummarizerModelId: (id: string | null) => {
      set({ summarizerModelId: id });
      persistState({ ...get(), summarizerModelId: id });
    },

    setPersonaId: (id: string | null) => {
      set({ personaId: id });
      persistState({ ...get(), personaId: id });
    },

    setAutoSummarize: (v: boolean) => {
      set({ autoSummarize: v });
      persistState({ ...get(), autoSummarize: v });
    },

    setAutoMemory: (v: boolean) => {
      set({ autoMemory: v });
      persistState({ ...get(), autoMemory: v });
    },
  };
};

export const useSettings = create<SettingsState>(creator);
