export type PersonaModel = { id: string; label: string; tags?: string[]; context?: number };
export type PersonaStyle = { id: string; name: string; system: string; hint?: string; allow?: string[]; deny?: string[] };
export type PersonaData = { models: PersonaModel[]; styles: PersonaStyle[] };

const MODEL_ID_RE = /^[a-z0-9._-]+(?:\/[a-z0-9._-]+)+$/i;
const STYLE_ID_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

export async function loadPersona(): Promise<{ data: PersonaData; warnings: string[] }> {
  const warnings: string[] = [];
  let data: any | null = await tryFetchJSON("/persona.json");
  if (!data) {
    const [m, s] = await Promise.all([tryFetchJSON("/models.json"), tryFetchJSON("/styles.json")]);
    if (m || s) data = { models: m?.models ?? m ?? [], styles: s?.styles ?? s ?? [] };
  }
  if (!data) {
    return {
      data: { models: [], styles: [{ id: "neutral", name: "Sachlich", system: "Kurz, präzise, Deutsch." }] },
      warnings: ["Konfiguration nicht geladen – Standardwerte aktiv."]
    };
  }
  const v = validatePersona(data);
  if (v.warnings.length) warnings.push(...v.warnings);
  return { data: { models: v.models, styles: v.styles }, warnings };
}

/** Wrapper für Code, der ein Array erwartet */
export async function loadPersonas(): Promise<Array<{ id: string } & PersonaData>> {
  const { data } = await loadPersona();
  // Persona-Objekt mit Pflichtfeld 'id' (App erwartet mindestens das)
  const one = { id: "default", ...data };
  return [one];
}

export function validatePersona(input: any): { models: PersonaModel[]; styles: PersonaStyle[]; warnings: string[] } {
  const warnings: string[] = []; const models: PersonaModel[] = []; const styles: PersonaStyle[] = [];

  if (Array.isArray(input.models)) {
    const seen = new Set<string>();
    input.models.forEach((m: any, i: number) => {
      const id = typeof m.id === "string" ? m.id.trim() : "";
      const label = typeof m.label === "string" ? m.label.trim() : "";
      if (!id || !MODEL_ID_RE.test(id)) { warnings.push(`Modell ${i}: ungültige id "${id}"`); return; }
      if (!label || label.length > 64) { warnings.push(`Modell ${i}: ungültiges Label`); return; }
      if (seen.has(id)) { warnings.push(`Modell ${i}: doppelte id "${id}"`); return; }
      seen.add(id);
      const out: PersonaModel = { id, label };
      if (Array.isArray(m.tags)) out.tags = m.tags.filter((t: any) => typeof t === "string");
      if (typeof m.context === "number") out.context = m.context;
      models.push(out);
    });
  }

  if (Array.isArray(input.styles)) {
    const seen = new Set<string>();
    input.styles.forEach((s: any, j: number) => {
      const id = typeof s.id === "string" ? s.id.trim() : "";
      const name = typeof s.name === "string" ? s.name.trim() : "";
      const system = typeof s.system === "string" ? s.system.trim() : "";
      const hint = typeof s.hint === "string" ? s.hint.trim() : "";
      const allow = Array.isArray(s.allow) ? s.allow.filter((x:any)=>typeof x==="string") : undefined;
      const deny  = Array.isArray(s.deny)  ? s.deny .filter((x:any)=>typeof x==="string") : undefined;

      const errs: string[] = [];
      if (!id || !STYLE_ID_RE.test(id)) errs.push("ungültige id");
      if (seen.has(id)) errs.push("doppelte id");
      if (name.length < 1 || name.length > 64) errs.push("Name Länge ungültig");
      if (system.length < 1 || system.length > 4000) errs.push("Systemprompt Länge ungültig");
      if (allow && deny) errs.push("allow und deny gleichzeitig");

      if (errs.length) { warnings.push(`Stil ${j} (${id||"?"}) übersprungen: ${errs.join(", ")}`); return; }
      seen.add(id);
      const out: PersonaStyle = { id, name, system };
      if (hint) out.hint = hint; if (allow) out.allow = allow; if (deny) out.deny = deny;
      styles.push(out);
    });
  }

  if (styles.length === 0) {
    warnings.push("Keine gültigen Stile – Default aktiv.");
    styles.push({ id:"neutral", name:"Sachlich", system:"Kurz, präzise, Deutsch." });
  }
  return { models, styles, warnings };
}

async function tryFetchJSON(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
