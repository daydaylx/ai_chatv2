import { useEffect, useMemo, useState } from "react";
import { OpenRouterClient } from "./lib/openrouter";
import ChatPanel from "./features/chat/ChatPanel";
import { AppShell } from "./widgets/shell/AppShell";
import { PersonaContext, PersonaData, PersonaStyle, PersonaModel } from "./entities/persona";

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [personaData, setPersonaData] = useState<PersonaData>({ models: [], styles: [] });
  const [personaWarnings, setPersonaWarnings] = useState<string[]>([]);
  const [personaError, setPersonaError] = useState<string | null>(null);

  useEffect(() => { loadPersona(); }, []);

  async function loadPersona() {
    setPersonaWarnings([]);
    setPersonaError(null);
    try {
      // 1) Single-Source: /persona.json
      let data: any | null = await tryFetchJSON("/persona.json");
      // 2) Fallback: getrennte Dateien /models.json + /styles.json
      if (!data) {
        const [models, styles] = await Promise.all([tryFetchJSON("/models.json"), tryFetchJSON("/styles.json")]);
        if (models || styles) data = { models: models?.models ?? models ?? [], styles: styles?.styles ?? styles ?? [] };
      }
      // 3) Fallback: src/data/persona.json oder personas.json (dev)
      if (!data) data = await tryFetchJSON("/src/data/persona.json") || await tryFetchJSON("/src/data/personas.json");
      // 4) Notfall: Defaults
      if (!data) throw new Error("not_found");

      const result = validatePersonaData(data);
      setPersonaData({ models: result.models, styles: result.styles });
      if (result.warnings.length) {
        setPersonaWarnings(result.warnings);
        setTimeout(() => setPersonaWarnings([]), 10000);
      }
    } catch {
      const defaultStyle: PersonaStyle = {
        id: "neutral",
        name: "Sachlich",
        system: "Du bist ein nüchterner, präziser Assistent. Antworte kurz und korrekt. Sprache: Deutsch."
      };
      setPersonaData({ models: [], styles: [defaultStyle] });
      setPersonaError("Konfiguration nicht geladen – Standardwerte aktiv.");
    }
  }

  async function tryFetchJSON(url: string): Promise<any | null> {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function validatePersonaData(input: any): { models: PersonaModel[]; styles: PersonaStyle[]; warnings: string[] } {
    const warnings: string[] = [];
    const models: PersonaModel[] = [];
    const styles: PersonaStyle[] = [];

    if (Array.isArray(input.models)) {
      const seenM = new Set<string>();
      for (let i = 0; i < input.models.length; i++) {
        const m = input.models[i] ?? {};
        const id = typeof m.id === "string" ? m.id.trim() : "";
        const label = typeof m.label === "string" ? m.label.trim() : "";
        if (!id || !/^[a-z0-9][a-z0-9._-]{1,63}$/i.test(id)) { warnings.push(`Modell ${i}: ungültige id`); continue; }
        if (seenM.has(id)) { warnings.push(`Modell ${i}: doppelte id "${id}"`); continue; }
        if (!label || label.length > 64) { warnings.push(`Modell ${i}: ungültiges Label`); continue; }
        seenM.add(id);
        const model: PersonaModel = { id, label };
        if (Array.isArray(m.tags)) model.tags = m.tags.filter((t: any) => typeof t === "string");
        if (typeof m.context === "number") model.context = m.context;
        models.push(model);
      }
    }

    if (Array.isArray(input.styles)) {
      const seenS = new Set<string>();
      for (let j = 0; j < input.styles.length; j++) {
        const s = input.styles[j] ?? {};
        const id = typeof s.id === "string" ? s.id.trim() : "";
        const name = typeof s.name === "string" ? s.name.trim() : "";
        const system = typeof s.system === "string" ? s.system.trim() : "";
        const hint = typeof s.hint === "string" ? s.hint.trim() : "";
        const allow = Array.isArray(s.allow) ? s.allow.filter((x: any) => typeof x === "string") : undefined;
        const deny = Array.isArray(s.deny) ? s.deny.filter((x: any) => typeof x === "string") : undefined;

        const errs: string[] = [];
        if (!id || !/^[a-z0-9][a-z0-9._-]{1,63}$/i.test(id)) errs.push("ungültige id");
        if (seenS.has(id)) errs.push("doppelte id");
        if (name.length < 1 || name.length > 64) errs.push("Name Länge ungültig");
        if (system.length < 1 || system.length > 4000) errs.push("Systemprompt Länge ungültig");
        if (allow && deny) errs.push("allow und deny gleichzeitig gesetzt");

        if (errs.length) { warnings.push(`Stil ${j} (${id||"?"}) übersprungen: ${errs.join(", ")}`); continue; }
        seenS.add(id);
        const style: PersonaStyle = { id, name, system };
        if (hint) style.hint = hint;
        if (allow) style.allow = allow;
        if (deny) style.deny = deny;
        styles.push(style);
      }
    }

    if (styles.length === 0) {
      warnings.push("Keine gültigen Stile – Standardstil verwendet.");
      styles.push({ id: "neutral", name: "Sachlich", system: "Du bist ein nüchterner, präziser Assistent. Antworte kurz und korrekt. Deutsch." });
    }

    return { models, styles, warnings };
  }

  return (
    <PersonaContext.Provider value={{ data: personaData, warnings: personaWarnings, error: personaError, reload: loadPersona }}>
      <AppShell>
        <ChatPanel client={client} />
      </AppShell>
    </PersonaContext.Provider>
  );
}
