/**
 * Stil→Modell-Regeln (ergänzende Policy) – greift OHNE Änderungen an personas.json.
 * Exakte IDs aus personas.json: uncensored, nsfw_expert, sex_therapist, nsfw_roleplay
 * Quelle: Venice Dolphin 24B, NeMo 12B, Mistral-(Large/Small/Nemo), Community (Goliath, lzlv 70B, Rocinante, Cydonia v1 22B, Euryale)
 */

export type StyleModelRule = {
  /** Exakt erlaubte Basis-IDs (ohne lokale Suffixe wie ":free") */
  allowedIds?: string[];
  /** Regex-Patterns (case-insensitive) gegen Model-ID ODER Anzeigenamen */
  allowedPatterns?: string[];
  /** Bevorzugte IDs (nur relevant, wenn du Auto-Switch aktivieren willst) */
  preferIds?: string[];
  /** true = blockieren (empfohlen), false = Auto-Switch (optional) */
  blockSend: boolean;
};

/** Basis-ID aus evtl. lokal erweiterten IDs extrahieren (z. B. "…:free") */
export function baseModelId(id: string): string {
  const idx = id.indexOf(":");
  return idx === -1 ? id : id.slice(0, idx);
}

/** Prüft, ob ein Modell (ID + optionaler Name) unter eine Regel fällt */
export function isModelAllowed(rule: StyleModelRule, modelId: string, modelName?: string | null): boolean {
  const id = baseModelId(modelId).toLowerCase();
  const name = (modelName ?? "").toLowerCase();

  if (rule.allowedIds?.some(x => baseModelId(x).toLowerCase() === id)) return true;

  if (rule.allowedPatterns?.length) {
    for (const pat of rule.allowedPatterns) {
      try {
        const rx = new RegExp(pat, "i");
        if (rx.test(id) || (name && rx.test(name))) return true;
      } catch {
        /* invalid regex → ignorieren */
      }
    }
  }
  return false;
}

/** Slugs exakt gemäß personas.json */
type StyleSlug = "uncensored" | "nsfw_expert" | "sex_therapist" | "nsfw_roleplay";

/**
 * Regeln:
 * - Venice Dolphin Mistral 24B Venice Edition → "venice.*dolphin.*24b"
 * - Nothing is Real NeMo 12B                  → "(nothing.*is.*real).*nemo.*12b" ODER "nemo.*12b"
 * - Mistral-Varianten (Large/Small/Nemo)      → "mistral.*(large|small|nemo)"
 * - Community-Favoriten/Optionen              → "goliath", "lzlv.*70b", "rocinante(.*12b)?", "cydonia.*(v1|22b)", "euryale"
 * - Provider-Präfixe (aus personas.json)      → "venice", "nothingiisreal", "cognitivecomputations", "sao10k", "liquid", "nvidia"
 */
const RULES: Record<StyleSlug, StyleModelRule> = {
  uncensored: {
    allowedPatterns: [
      "^venice",                    // Provider-Prefix, z. B. "venice/…"
      "^nothingiisreal",            // korrekt geschrieben wie in personas.json
      "^cognitivecomputations",
      "^liquid", "^nvidia",
      "venice.*dolphin.*24b",       // Venice Dolphin Mistral 24B Venice Edition
      "(nothing.*is.*real).*nemo.*12b",
      "nemo.*12b",
      "mistral.*(large|small|nemo)",
      "goliath",
      "lzlv.*70b",
      "rocinante(.*12b)?",
      "cydonia.*(v1|22b)",
      "euryale"
    ],
    blockSend: true
  },

  nsfw_expert: {
    allowedPatterns: [
      "^venice", "^nothingiisreal", "^cognitivecomputations", "^sao10k", "^liquid", "^nvidia",
      "venice.*dolphin.*24b",
      "(nothing.*is.*real).*nemo.*12b",
      "nemo.*12b",
      "mistral.*(large|small|nemo)",
      "goliath"
    ],
    blockSend: true
  },

  sex_therapist: { // Schreibweise wie in personas.json (Label: Sex-Therapeut)
    allowedPatterns: [
      "^nothingiisreal", "^cognitivecomputations", "^venice", "^liquid", "^nvidia",
      "mistral.*large",
      "mistral.*nemo.*12b",
      "cydonia.*(v1|22b)"
    ],
    blockSend: true
  },

  nsfw_roleplay: {
    allowedPatterns: [
      "^venice", "^nothingiisreal", "^sao10k", "^liquid", "^nvidia", "^cognitivecomputations",
      "(nothing.*is.*real).*nemo.*12b",
      "nemo.*12b",
      "rocinante.*12b",
      "euryale",
      "venice.*dolphin.*24b"
    ],
    blockSend: true
  }
};

/** Exakte Zuordnung per ID; Fallback via Name für zukünftige Stile */
function resolveSlug(styleId?: string | null, styleName?: string | null): StyleSlug | null {
  const id = (styleId ?? "").toLowerCase();
  if (id in RULES) return id as StyleSlug;

  const name = (styleName ?? "").toLowerCase();
  if (/uncensor|unzensiert/.test(name)) return "uncensored";
  if (/nsfw.*(expert|experte)/.test(name)) return "nsfw_expert";
  if (/sex.*therap(eut|euth)/.test(name)) return "sex_therapist";
  if (/nsfw.*role|role.*play/.test(name)) return "nsfw_roleplay";
  return null;
}

/** Öffentliche API */
export function ruleForStyle(styleId: string | null | undefined, styleName?: string | null): StyleModelRule | null {
  const slug = resolveSlug(styleId, styleName);
  return slug ? RULES[slug] : null;
}

export const STYLE_MODEL_RULES = RULES;
