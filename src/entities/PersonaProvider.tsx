import * as React from "react";
import { PersonaContext, type PersonaData } from "./persona";

async function tryFetchJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<PersonaData>({ models: [], styles: [] });
  const [error, setError] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const load = React.useCallback(async () => {
    setError(null); setWarnings([]);
    // Reihenfolge: /persona.json → (/models.json + /styles.json) → Fallback
    let d: PersonaData = { models: [], styles: [] };
    const p = await tryFetchJSON("/persona.json");
    if (p && (Array.isArray(p.models) || Array.isArray(p.styles))) {
      d.models = Array.isArray(p.models) ? p.models : [];
      d.styles = Array.isArray(p.styles) ? p.styles : [];
    } else {
      const [m, s] = await Promise.all([tryFetchJSON("/models.json"), tryFetchJSON("/styles.json")]);
      if (m) d.models = Array.isArray(m.models) ? m.models : (Array.isArray(m) ? m : []);
      if (s) d.styles = Array.isArray(s.styles) ? s.styles : (Array.isArray(s) ? s : []);
    }
    if (!d.styles.length) {
      // Minimaler Default-Style, wenn nichts vorhanden ist
      d.styles = [{ id: "neutral", name: "Neutral", system: "Du bist ein sachlicher Assistent. Antworte präzise." }];
      setWarnings((w) => [...w, "Keine styles gefunden – neutraler Fallback gesetzt."]);
    }
    setData(d);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const ctx = React.useMemo(() => ({
    data, error, warnings,
    reload: load,
  }), [data, error, warnings, load]);

  return <PersonaContext.Provider value={ctx}>{children}</PersonaContext.Provider>;
}
