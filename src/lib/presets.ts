import raw from "../data/personas.json";

export type PersonaPreset = {
  id: string;          // [a-z0-9._-], 2..64
  label: string;       // 1..64
  description: string; // 1..200
  system: string;      // 1..4000
  allow?: string[];    // optionale Muster (Glob) für erlaubte Modell-IDs
  deny?: string[];     // optionale Muster (Glob) für verbotene Modell-IDs
};

function isString(x: unknown): x is string {
  return typeof x === "string";
}
function normStr(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
function validId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,63}$/.test(id);
}
function globToRegExp(glob: string): RegExp {
  // einfache Glob-Umsetzung: * -> .*, ? -> .
  const esc = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp("^" + esc + "$", "i");
}

function toStringArray(maybe: unknown): string[] | undefined {
  if (!Array.isArray(maybe)) return undefined;
  const out = maybe.filter(isString).map(normStr).filter(Boolean);
  return out.length ? Array.from(new Set(out)) : undefined;
}

function validateAndNormalize(input: unknown): PersonaPreset[] {
  if (!Array.isArray(input)) {
    console.error("[presets] personas.json ist kein Array – verwende Fallback.");
    return fallback();
  }
  const seen = new Set<string>();
  const out: PersonaPreset[] = [];
  for (let idx = 0; idx < input.length; idx++) {
    const rec = (input[idx] ?? {}) as Record<string, unknown>;
    const id = isString(rec.id) ? rec.id.trim() : "";
    const label = isString(rec.label) ? normStr(rec.label) : "";
    const description = isString(rec.description) ? normStr(rec.description) : "";
    const system = isString(rec.system) ? String(rec.system).trim() : "";
    const allow = toStringArray(rec.allow);
    const deny  = toStringArray(rec.deny);

    const errors: string[] = [];
    if (!validId(id)) errors.push("id ungültig (erlaubt: [a-z0-9._-], Länge 2..64)");
    if (seen.has(id)) errors.push("id doppelt");
    if (label.length < 1 || label.length > 64) errors.push("label Länge 1..64");
    if (description.length < 1 || description.length > 200) errors.push("description Länge 1..200");
    if (system.length < 1 || system.length > 4000) errors.push("system Länge 1..4000");
    if (allow && deny) errors.push("allow und deny gleichzeitig gesetzt – nur eines verwenden");

    if (errors.length) {
      console.warn(`[presets] Eintrag ${idx} übersprungen (id="${id || "?"}"): ${errors.join(", ")}`);
      continue;
    }
    seen.add(id);
    const item: PersonaPreset = { id, label, description, system };
    if (allow) item.allow = allow;
    if (deny) item.deny = deny;
    out.push(item);
  }

  if (out.length === 0) {
    console.error("[presets] Keine gültigen Presets – verwende Fallback.");
    return fallback();
  }

  // stabile Sortierung
  out.sort((a, b) => (a.label.localeCompare(b.label) || a.id.localeCompare(b.id)));
  return out;
}

function fallback(): PersonaPreset[] {
  return [
    {
      id: "neutral",
      label: "Neutral & hilfreich",
      description: "Sachlich, präzise, ohne unnötige Floskeln.",
      system: "Du bist ein nüchterner, präziser Assistent. Antworte kurz und korrekt. Sprache: Deutsch."
    }
  ];
}

// Exportierte, validierte Presets
export const PRESETS: PersonaPreset[] = validateAndNormalize(raw as unknown);

export function getPresetById(id: string | undefined | null): PersonaPreset | undefined {
  if (!id) return undefined;
  return PRESETS.find(p => p.id === id);
}

export function isModelAllowedByPreset(preset: PersonaPreset | undefined, modelId: string): boolean {
  if (!preset) return true;
  const id = modelId.trim();
  if (!id) return false;
  if (preset.allow) {
    return preset.allow.some(gl => globToRegExp(gl).test(id));
  }
  if (preset.deny) {
    return !preset.deny.some(gl => globToRegExp(gl).test(id));
  }
  return true;
}
