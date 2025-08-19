export type StyleModelRule = {
  /** Exakt erlaubte Basis-IDs (ohne lokale Suffixe wie ":free") */
  allowedIds?: string[];
  /**
   * Zusätzliche Pattern (Regex-Strings, case-insensitive) gegen ID ODER Anzeigenamen.
   * Beispiel: "venice.*dolphin.*24b", "nemo.*12b", "mistral.*(large|small|nemo)", "goliath", "rocinante"
   */
  allowedPatterns?: string[];
  /** Optional bevorzugte IDs (nur Auto-Switch, falls du später möchtest) */
  preferIds?: string[];
  /** true = Senden blockieren, wenn Modell nicht erlaubt; false = Auto-Switch (hier standardmäßig true für Sicherheit) */
  blockSend: boolean;
};

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
      } catch { /* invalid regex ignored */ }
    }
  }
  return false;
}

/* -------- Slugs & Mapping -------- */
type StyleSlug = "unzensiert" | "nsfw_experte" | "sex_therapeut" | "nsfw_roleplay";

/**
 * Mapping-Regeln (an deine Liste angelehnt):
 * - Venice Dolphin Mistral 24B Venice Edition  → "venice.*dolphin.*24b"
 * - Nothing is Real NeMo 12B                   → "nothing.*is.*real|nemo.*12b"
 * - Mistral Large/Small/Nemo                   → "mistral.*(large|small|nemo)"
 * - Community: Goliath, lzlv 70B, Rocinante, Cydonia v1 (22B), Euryale, Rocinante 12B
 */
const RULES: Record<StyleSlug, StyleModelRule> = {
  unzensiert: {
    // Fokus auf konsequent unzensierte/freie Modelle
    allowedPatterns: [
      "venice.*dolphin.*24b",            // Venice Dolphin 24B Venice Edition
      "(nothing.*is.*real).*nemo.*12b",  // (falls Name so geführt)
      "nemo.*12b",                       // NeMo 12B (generisch)
      "mistral.*(large|small|nemo)",     // Mistral-Varianten unzensiert
      "goliath",
      "lzlv.*70b",
      "rocinante(?!.*12b)?",             // Rocinante (ohne 12B spezifisch)
      "cydonia.*(v1)?(.*22b)?",
      "euryale"
    ],
    // Falls du exakte IDs kennst, pflege sie zusätzlich:
    allowedIds: [
      // Beispiel: "veniceai/venice-dolphin-mistral-24b"
    ],
    blockSend: true
  },

  nsfw_experte: {
    // Explizit Venice Dolphin + Mistral Nemo/Familie
    allowedPatterns: [
      "venice.*dolphin.*24b",
      "mistral.*nemo.*12b",
      "mistral.*(large|small)",
      "goliath"
    ],
    allowedIds: [],
    blockSend: true
  },

  sex_therapeut: { // korrigierte Schreibweise
    // Fokus auf seriöseren, kohärenten Helfern – Mistral Large/Nemo
    allowedPatterns: [
      "mistral.*large",
      "mistral.*nemo.*12b",
      "cydonia.*v1",
    ],
    allowedIds: [],
    blockSend: true
  },

  nsfw_roleplay: {
    // Primär: Nothing is Real NeMo 12B + Rollenspiel-freundliche
    allowedPatterns: [
      "(nothing.*is.*real).*nemo.*12b",
      "nemo.*12b",
      "rocinante.*12b",
      "euryale",
      "venice.*dolphin.*24b"
    ],
    allowedIds: [],
    blockSend: true
  }
};

/** Robust: per ID oder Name auf Slug abbilden (deutsch + häufige Tippfehler) */
function resolveSlug(styleId?: string | null, styleName?: string | null): StyleSlug | null {
  const t = `${styleId ?? ""} ${styleName ?? ""}`.toLowerCase();
  if (/unzensi|uncensor/.test(t)) return "unzensiert";
  if (/nsfw.*(expert|experte)/.test(t)) return "nsfw_experte";
  if (/sex.*therap(eut|euth)/.test(t)) return "sex_therapeut"; // „Therapeut“ und „Therapeuth“
  if (/nsfw.*role|role.*play/.test(t)) return "nsfw_roleplay";
  return null;
}

export function ruleForStyle(styleId: string | null | undefined, styleName?: string | null): StyleModelRule | null {
  const slug = resolveSlug(styleId, styleName);
  return slug ? RULES[slug] : null;
}

/** Export (Debug/Tests) */
export const STYLE_MODEL_RULES = RULES;
