import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";

export type ModelFilter = {
  freeOnly: boolean;
  nsfwAllowed: boolean;
  codePreferred: boolean;
};

export type SettingsState = {
  theme: ThemeMode;
  language: "de" | "en";

  /** Aktuell gewähltes Inferenzmodell (für Chat). */
  modelId?: string;

  /** Legacy/kompatibel, wird mit modelId synchron gehalten. */
  activeModelId?: string;

  /** Gewählte Persona/Style-ID für UI/Prompting. */
  personaId?: string;

  /** Steuerung automatischer Zusammenfassungen. */
  autoSummarize: boolean;

  /** Steuerung automatischer Memory-Extraktion. */
  autoMemory: boolean;

  /** Modell für die Zusammenfassung (optional). */
  summarizerModelId: string | null;

  /** Generische Filter. */
  filters: ModelFilter;
};

type SettingsActions = {
  setTheme: (mode: ThemeMode) => void;
  setLanguage: (lang: "de" | "en") => void;

  /** Setzt das Hauptmodell; hält activeModelId in Sync. */
  setModelId: (id: string | undefined) => void;

  /** Kompatibel zu bestehendem Code; hält modelId in Sync. */
  setActiveModel: (id: string | undefined) => void;

  /** Wählt Persona/Style. */
  setPersonaId: (id: string | undefined) => void;

  /** Filter-Mutation. */
  setFilters: (next: Partial<ModelFilter>) => void;

  /** Toggles/Setter für Auto-Funktionen. */
  setAutoSummarize: (v: boolean) => void;
  setAutoMemory: (v: boolean) => void;

  /** Summarizer-Modell setzen. */
  setSummarizerModelId: (id: string | null) => void;

  /** Auf Defaults zurücksetzen. */
  reset: () => void;
};

const initialState: SettingsState = {
  theme: "system",
  language: "de",
  modelId: undefined,
  activeModelId: undefined,
  personaId: "neutral",
  autoSummarize: false,
  autoMemory: false,
  summarizerModelId: null,
  filters: { freeOnly: true, nsfwAllowed: true, codePreferred: false },
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  ...initialState,

  setTheme: (mode) => set({ theme: mode }),
  setLanguage: (lang) => set({ language: lang }),

  setModelId: (id) =>
    set(() => ({ modelId: id, activeModelId: id })),

  setActiveModel: (id) =>
    set(() => ({ activeModelId: id, modelId: id })),

  setPersonaId: (id) => set(() => ({ personaId: id === null ? undefined : id })),

  setFilters: (next) => set({ filters: { ...get().filters, ...next } }),

  setAutoSummarize: (v) => set({ autoSummarize: v }),
  setAutoMemory: (v) => set({ autoMemory: v }),

  setSummarizerModelId: (id) => set({ summarizerModelId: id }),

  reset: () => set({ ...initialState }),
}));

// Alias für bestehende Tests/Call-Sites:
export const useSettings = useSettingsStore;
