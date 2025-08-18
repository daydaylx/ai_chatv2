import React from "react";

/** Style/Persona wie im Projekt bereits genutzt: */
export type PersonaStyle = {
  id: string;             // stabil
  name: string;
  description?: string;
  /** WICHTIG: Das ist der unveränderte System-Prompt-Text */
  system: string;

  /** optional genutzte Felder im Code: */
  hint?: string;
  allow?: string[];       // z. B. erlaubte Modelle/Tags
  deny?: string[];        // z. B. verbotene Modelle/Tags
};

/** Modell-Metadaten; mehrere Synonyme werden toleriert (label/name, ctx/context): */
export type PersonaModel = {
  id: string;
  name?: string;
  label?: string;
  description?: string;

  /** Kontextlänge – beide Schreibweisen zulassen: */
  ctx?: number;
  context?: number;

  /** optionale Flags/Tags aus dem Projekt: */
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
  tags?: string[];
};

export type PersonaData = {
  styles: PersonaStyle[];
  models: PersonaModel[];
};

export type PersonaContextType = {
  data: PersonaData;
  warnings: string[];
  error: string | null;
  reload: () => Promise<void> | void;
};

export const PersonaContext = React.createContext<PersonaContextType>({
  data: { styles: [], models: [] },
  warnings: [],
  error: null,
  reload: async () => {},
});
