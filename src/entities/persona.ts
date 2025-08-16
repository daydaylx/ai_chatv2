import { createContext } from "react";

export type PersonaModel = { id: string; label: string; tags?: string[]; context?: number };
export type PersonaStyle = { id: string; name: string; system: string; hint?: string; allow?: string[]; deny?: string[] };
export type PersonaData = { models: PersonaModel[]; styles: PersonaStyle[] };

export type PersonaContextValue = {
  data: PersonaData;
  warnings: string[];
  error: string | null;
  reload: () => void;
};

export const PersonaContext = createContext<PersonaContextValue | null>(null);
