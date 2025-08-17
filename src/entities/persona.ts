import React from "react";

export type PersonaModel = { id: string; label: string; tags?: string[]; context?: number };
export type PersonaStyle = { id: string; name: string; system: string; hint?: string; allow?: string[]; deny?: string[] };
export type PersonaModelGroup = { id: string; name: string; include?: string[]; exclude?: string[]; tags?: string[] };
export type PersonaData = { models: PersonaModel[]; styles: PersonaStyle[]; modelGroups?: PersonaModelGroup[] };

export const PersonaContext = React.createContext<{
  data: PersonaData;
  warnings: string[];
  error: string | null;
  reload: () => Promise<void>;
}>({
  data: { models: [], styles: [] },
  warnings: [],
  error: null,
  reload: async () => {}
});
