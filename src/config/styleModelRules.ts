export type StyleModelRule = {
  /** Erlaubte Modelle (Basis-IDs ohne Suffixe wie ":free") */
  allowed: string[];
  /** Bevorzugte Reihenfolge – erster Treffer wird beim Auto-Switch gewählt */
  prefer?: string[];
  /**
   * true  → Senden blockieren, wenn aktuelles Modell nicht erlaubt (öffnet Picker).
   * false → automatisch auf prefer[0] oder erstes allowed wechseln (mit Toast).
   */
  blockSend?: boolean;
};

/** Basis-ID aus evtl. lokal erweiterten IDs extrahieren (z. B. "…:free") */
export function baseModelId(id: string): string {
  const idx = id.indexOf(":");
  return idx === -1 ? id : id.slice(0, idx);
}

/** Slugs für Styles (IDs/Namen werden darauf gemappt) */
type StyleSlug = "unzensiert" | "nsfw_experte" | "sex_therapeuth" | "nsfw_roleplay";

/** Kanonische Regeln – passe Model-IDs bei Bedarf an deine Realität an */
const RULES: Record<StyleSlug, StyleModelRule> = {
  // 1) „Unzensiert“
  unzensiert: {
    allowed: [
      "cognitivecomputations/dolphin-mixtral-8x7b",
      "cognitivecomputations/dolphin-mistral-7b",
      "qwen/qwen2.5-32b-instruct",
    ],
    prefer: ["cognitivecomputations/dolphin-mixtral-8x7b"],
    blockSend: false,
  },

  // 2) „NSFW Experte“
  nsfw_experte: {
    allowed: [
      "cognitivecomputations/dolphin-mixtral-8x7b",
      "qwen/qwen2.5-32b-instruct",
    ],
    prefer: ["cognitivecomputations/dolphin-mixtral-8x7b"],
    blockSend: false,
  },

  // 3) „Sex Therapeuth“ (bewusst Schreibweise wie von dir)
  sex_therapeuth: {
    allowed: [
      "qwen/qwen2.5-32b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
    ],
    prefer: ["qwen/qwen2.5-32b-instruct"],
    blockSend: true, // bewusst restriktiv
  },

  // 4) „NSFW Roleplay“
  nsfw_roleplay: {
    allowed: [
      "cognitivecomputations/dolphin-mixtral-8x7b",
      "cognitivecomputations/dolphin-mistral-7b",
    ],
    prefer: ["cognitivecomputations/dolphin-mixtral-8x7b"],
    blockSend: false,
  },
};

/** ID/Name robust auf einen Regel-Slug mappen */
function matchStyleSlug(styleId?: string | null, styleName?: string | null): StyleSlug | null {
  const text = `${styleId ?? ""} ${styleName ?? ""}`.toLowerCase();

  if (/unzensi|uncensor/.test(text)) return "unzensiert";
  if (/nsfw.*(expert|experte)/.test(text)) return "nsfw_experte";
  if (/sex.*therap/.test(text)) return "sex_therapeuth";
  if (/nsfw.*role|role.*play/.test(text)) return "nsfw_roleplay";

  return null;
}

/**
 * Hole die passende Regel für einen Stil.
 * - Greift per Stil-ID oder (Fallback) Name-Substring.
 * - Gibt null zurück, wenn keine Bindung vorgesehen ist.
 */
export function ruleForStyle(styleId: string | null | undefined, styleName?: string | null): StyleModelRule | null {
  const slug = matchStyleSlug(styleId, styleName);
  return slug ? RULES[slug] : null;
}

/** Optional: Rohdaten exportieren (Debug/Tests) */
export const STYLE_MODEL_RULES = RULES;
