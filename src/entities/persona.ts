import * as React from "react";

export type PersonaModel = {
  id: string;
  name?: string;
  label?: string;
  description?: string;
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
  tags?: string[];
};

export type PersonaStyle = {
  id: string;
  name: string;
  description?: string;
  system: string;
};

export type PersonaData = {
  models: PersonaModel[];
  styles: PersonaStyle[];
};

export type PersonaContextType = {
  data: PersonaData;
  error: string | null;
  warnings: string[];
  reload: () => Promise<void> | void;
};

export const PersonaContext = React.createContext<PersonaContextType>({
  data: { models: [], styles: [] },
  error: null,
  warnings: [],
  reload: () => {},
});
