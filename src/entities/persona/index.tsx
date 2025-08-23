/* eslint-disable react-refresh/only-export-components */
import * as React from "react";

/** ---- Typen ---- */
export type Style = {
  id: string;
  name: string;
  description?: string;
  system?: string;
};

export type PersonaModel = {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  free?: boolean;
  fast?: boolean;
  allow_nsfw?: boolean;
};

export type PersonaData = {
  styles: Style[];
  models: PersonaModel[];
};

/** ---- Defaults (Fallback, falls JSON fehlt/defekt) ---- */
const defaultData: PersonaData = {
  styles: [
    { id: "neutral", name: "Neutral", description: "Sachlich, präzise", system: "Du bist ein sachlicher Assistent. Antworte präzise und knapp." },
    { id: "coding", name: "Coding", description: "Knappe Technik-Antworten", system: "Du antwortest knapp, mit Code-Beispielen, keine Floskeln." }
  ],
  models: [
    { id: "mistral-small", name: "Mistral Small", tags: ["fast"], fast: true },
    { id: "llama-3.1-8b", name: "Llama 3.1 8B", tags: ["fast","free"], free: true, fast: true }
  ]
};

/** ---- Normalisierung/Validierung auf kleinem Fuß ---- */
function normalize(data: any): PersonaData {
  const out: PersonaData = { styles: [], models: [] };

  if (Array.isArray(data?.styles)) {
    out.styles = data.styles
      .filter((s: any) => s && typeof s.id === "string" && typeof s.name === "string")
      .map((s: any) => ({
        id: String(s.id),
        name: String(s.name),
        description: s.description ? String(s.description) : undefined,
        system: s.system ? String(s.system) : undefined
      }));
  }

  if (Array.isArray(data?.models)) {
    out.models = data.models
      .filter((m: any) => m && typeof m.id === "string")
      .map((m: any) => ({
        id: String(m.id),
        name: m.name ? String(m.name) : undefined,
        description: m.description ? String(m.description) : undefined,
        tags: Array.isArray(m.tags) ? m.tags.map((t: any) => String(t)) : undefined,
        free: Boolean(m.free),
        fast: Boolean(m.fast),
        allow_nsfw: Boolean(m.allow_nsfw)
      }));
  }

  // Fallbacks wenn Arrays leer/fehlen
  if (!out.styles.length) out.styles = defaultData.styles;
  if (!out.models.length) out.models = defaultData.models;
  return out;
}

/** ---- Context & Provider ---- */
export const PersonaContext = React.createContext<{ data: PersonaData }>({ data: defaultData });

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<PersonaData>(defaultData);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Vite-Asset URL -> funktioniert ohne TS-JSON-Import-Flag
        const url = new URL("../../data/persona.json", import.meta.url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`persona.json ${res.status}`);
        const json = await res.json();
        const merged = normalize(json);
        if (alive) setData(merged);
      } catch (e) {
        console.warn("persona.json laden fehlgeschlagen – nutze Defaults:", e);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <PersonaContext.Provider value={{ data }}>
      {children}
    </PersonaContext.Provider>
  );
}
