import * as React from "react";

export type Style = { id: string; name: string; description?: string; system?: string };
export type PersonaData = {
  styles: Style[];
  models: Array<{
    id: string;
    name?: string;
    description?: string;
    tags?: string[];
    free?: boolean;
    fast?: boolean;
    allow_nsfw?: boolean;
  }>;
};

const defaultData: PersonaData = {
  styles: [
    {
      id: "neutral",
      name: "Neutral",
      description: "Sachlich, präzise",
      system: "Du bist ein sachlicher Assistent. Antworte präzise und knapp."
    },
    {
      id: "coding",
      name: "Coding",
      description: "Knappe Technik-Antworten",
      system: "Du antwortest knapp, mit Code-Beispielen, keine Floskeln."
    }
  ],
  models: [
    { id: "mistral-small", name: "Mistral Small", tags: ["fast"] },
    { id: "llama-3.1-8b", name: "Llama 3.1 8B", tags: ["fast", "free"] }
  ]
};

export const PersonaContext = React.createContext<{ data: PersonaData }>({ data: defaultData });

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersonaContext.Provider value={{ data: defaultData }}>
      {children}
    </PersonaContext.Provider>
  );
}
