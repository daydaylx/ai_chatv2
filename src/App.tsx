import { useEffect, useMemo, useState } from "react";
import ChatPanel from "./features/chat/ChatPanel";
import { AppShell } from "./widgets/shell/AppShell";
import { OpenRouterClient } from "./lib/openrouter";
import { PersonaContext, PersonaData, PersonaStyle, PersonaModel } from "./entities/persona";

/**
 * Ziel:
 * - Ursprüngliche UX: AppShell + ChatPanel (ein Screen), Settings/Modelle/Stile in Sheets/Drawer
 * - persona.json bleibt Single Source of Truth (wird geladen/validiert)
 * - KEIN zusätzlicher Header-UI-Kram (Picker etc.) -> unveränderte Optik
 */

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [persona, setPersona] = useState<PersonaData>({ models: [], styles: [] });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void loadPersona(); }, []);

  async function loadPersona() {
    setWarnings([]);
    setError(null);
    try {
      let data: any | null = await tryFetchJSON("/persona.json");
      if (!data) {
        const [models, styles] = await Promise.all([
          tryFetchJSON("/models.json"),
          tryFetchJSON("/styles.json"),
        ]);
        if (models || styles) {
          data = {
            models: Array.isArray(models?.models) ? models.models : (Array.isArray(models) ? models : []),
            styles: Array.isArray(styles?.styles) ? styles.styles : (Array.isArray(styles) ? styles : []),
          };
        }
      }
      if (!data) throw new Error("not_found");

      const v = validatePersona(data);
      setPersona({ models: v.models, styles: v.styles });
      if (v.warnings.length) setWarnings(v.warnings);
    } catch {
      setPersona({
        models: [],
        styles: [{
          id: "neutral",
          name: "Sachlich",
          system: "Du bist nüchtern, präzise, knapp. Sprache: Deutsch."
        }],
      });
      setError("Konfiguration nicht geladen – Standardwerte aktiv.");
    }
  }

  async function tryFetchJSON(url: string): Promise<any | null> {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function validatePersona(input: any): { models: PersonaModel[]; styles: PersonaStyle[]; warnings: string[] } {
    const warnings: string[] = [];
    const models: PersonaModel[] = [];
    const styles: PersonaStyle[] = [];

    // Modell-IDs im Format provider/model (mind. 1 Slash)
    const MODEL_ID_RE = /^[a-z0-9._-]+(?:\/[a-z0-9._-]+)+$/i;
    const STYLE_ID_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

    if (Array.isArray(input.models)) {
      const seen = new Set<string>();
      for (let i = 0; i < input.models.length; i++) {
        const m = input.models[i] ?? {};
        const id = typeof m.id === "string" ? m.id.trim() : "";
        const label = typeof m.label === "string" ? m.label.trim() : "";
        if (!id || !MODEL_ID_RE.test(id)) { warnings.push(`Modell ${i}: ungültige id "${id}"`); continue; }
        if (!label || label.length > 64) { warnings.push(`Modell ${i}: ungültiges Label`); continue; }
        if (seen.has(id)) { warnings.push(`Modell ${i}: doppelte id "${id}"`); continue; }
        seen.add(id);
        const out: PersonaModel = { id, label };
        if (Array.isArray(m.tags)) out.tags = m.tags.filter((t: any) => typeof t === "string");
        if (typeof m.context === "number") out.context = m.context;
        models.push(out);
      }
    }

    if (Array.isArray(input.styles)) {
      const seen = new Set<string>();
      for (let j = 0; j < input.styles.length; j++) {
        const s = input.styles[j] ?? {};
        const id = typeof s.id === "string" ? s.id.trim() : "";
        const name = typeof s.name === "string" ? s.name.trim() : "";
        const system = typeof s.system === "string" ? s.system.trim() : "";
        const hint = typeof s.hint === "string" ? s.hint.trim() : "";
        const allow = Array.isArray(s.allow) ? s.allow.filter((x: any) => typeof x === "string") : undefined;
        const deny  = Array.isArray(s.deny)  ? s.deny .filter((x: any) => typeof x === "string") : undefined;

        const errs: string[] = [];
        if (!id || !STYLE_ID_RE.test(id)) errs.push("ungültige id");
        if (seen.has(id)) errs.push("doppelte id");
        if (name.length < 1 || name.length > 64) errs.push("Name Länge ungültig");
        if (system.length < 1 || system.length > 4000) errs.push("Systemprompt Länge ungültig");
        if (allow && deny) errs.push("allow und deny gleichzeitig");

        if (errs.length) { warnings.push(`Stil ${j} (${id || "?"}) übersprungen: ${errs.join(", ")}`); continue; }
        seen.add(id);
        const out: PersonaStyle = { id, name, system };
        if (hint) out.hint = hint;
        if (allow) out.allow = allow;
        if (deny)  out.deny  = deny;
        styles.push(out);
      }
    }

    if (styles.length === 0) {
      warnings.push("Keine gültigen Stile – Default aktiv.");
      styles.push({ id: "neutral", name: "Sachlich", system: "Du bist nüchtern, präzise, knapp. Deutsch." });
    }

    return { models, styles, warnings };
  }

  return (
    <PersonaContext.Provider value={{ data: persona, warnings, error, reload: loadPersona }}>
      <AppShell>
        <ChatPanel client={client} />
      </AppShell>
    </PersonaContext.Provider>
  );
}
