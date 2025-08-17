import { loadModularPersona } from "./lib/configLoader";
import type { PersonaData, PersonaModel, PersonaStyle, PersonaModelGroup } from "./entities/persona";

const MODEL_ID_RE = /^[a-z0-9._-]+(?:\/[a-z0-9._-]+)+(?::[a-z0-9._-]+)?$/i;
const STYLE_ID_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i;
const GROUP_ID_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

export type PersonaLoadResult = { data: PersonaData; warnings: string[] };

export async function loadPersonaData(): Promise<PersonaLoadResult> {
  const warnings: string[] = [];
  try {
    const raw = await loadModularPersona();
    if (!raw) throw new Error("not_found");

    const models: PersonaModel[] = [];
    const styles: PersonaStyle[] = [];
    const groups: PersonaModelGroup[] = [];

    if (Array.isArray((raw as any).models)) {
      const seen = new Set<string>();
      (raw as any).models.forEach((m: any, i: number) => {
        const id = typeof m?.id === "string" ? m.id.trim() : "";
        const label = typeof m?.label === "string" ? m.label.trim() : id;
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

    if (Array.isArray((raw as any).styles)) {
      const seen = new Set<string>();
      (raw as any).styles.forEach((s: any, j: number) => {
        const id = typeof s?.id === "string" ? s.id.trim() : "";
        const name = typeof s?.name === "string" ? s.name.trim() : "";
        const system = typeof s?.system === "string" ? s.system.trim() : "";
        const hint = typeof s?.hint === "string" ? s.hint.trim() : "";
        const allow = Array.isArray(s?.allow) ? s.allow.filter((x:any)=>typeof x==="string") : undefined;
        const deny  = Array.isArray(s?.deny)  ? s.deny .filter((x:any)=>typeof x==="string") : undefined;

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

    const rawGroups: any[] =
      Array.isArray((raw as any).modelGroups) ? (raw as any).modelGroups :
      Array.isArray((raw as any).groups) ? (raw as any).groups : [];

    rawGroups.forEach((g: any, k: number) => {
      const id = typeof g?.id === "string" ? g.id.trim() : "";
      const name = typeof g?.name === "string" ? g.name.trim() : "";
      const include = Array.isArray(g?.include) ? g.include.filter((x:any)=>typeof x==="string") : undefined;
      const exclude = Array.isArray(g?.exclude) ? g.exclude.filter((x:any)=>typeof x==="string") : undefined;
      const tags = Array.isArray(g?.tags) ? g.tags.filter((x:any)=>typeof x==="string") : undefined;

      const errs: string[] = [];
      if (!id || !GROUP_ID_RE.test(id)) errs.push("ungültige id");
      if (!name) errs.push("Name fehlt");
      if ((!include || include.length===0) && (!tags || tags.length===0)) errs.push("weder include noch tags definiert");
      if (errs.length) { warnings.push(`Gruppe ${k} (${id||"?"}) übersprungen: ${errs.join(", ")}`); return; }
      groups.push({ id, name, include, exclude, tags });
    });

    if (styles.length === 0) {
      warnings.push("Keine gültigen Stile – Default aktiv.");
      styles.push({ id:"neutral", name:"Sachlich", system:"Kurz, präzise, Deutsch." });
    }

    return { data: { models, styles, modelGroups: groups }, warnings };
  } catch {
    return {
      data: {
        models: [],
        styles: [{ id:"neutral", name:"Sachlich", system:"Kurz, präzise, Deutsch." }]
      },
      warnings: ["Konfiguration nicht geladen – Standardwerte aktiv."]
    };
  }
}
