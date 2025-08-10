import type { PersonaPreset } from "./presets";

/**
 * Erweiterte Model-Typen für bessere Typisierung
 */
export interface ModelInfo {
  id?: string;
  name?: string;
  pricing?: any;
  price?: any;
  context_length?: number;
  contextLength?: number;
  tags?: string[];
  description?: string;
}

/**
 * Filter-Optionen für erweiterte Model-Suche
 */
export interface FilterOptions {
  text?: string;
  onlyFree?: (m: ModelInfo) => boolean;
  onlyFast?: (m: ModelInfo) => boolean;
  onlyUncensored?: (m: ModelInfo) => boolean;
  onlyLargeContext?: (m: ModelInfo) => boolean;
  onlyCode?: (m: ModelInfo) => boolean;
}

/**
 * Hauptfilter-Funktion: Filtert Modelle basierend auf Preset-Kompatibilität
 */
export function filterModelsForPreset<T extends ModelInfo>(
  models: T[],
  preset?: PersonaPreset,
  opts: FilterOptions = {}
): T[] {
  const searchText = (opts.text || "").trim().toLowerCase();

  return models.filter(model => {
    const modelId = String(model?.id ?? "");
    const modelName = String(model?.name ?? "");
    
    // Zusätzliche Filter anwenden
    if (opts.onlyFree && !opts.onlyFree(model)) return false;
    if (opts.onlyFast && !opts.onlyFast(model)) return false; 
    if (opts.onlyUncensored && !opts.onlyUncensored(model)) return false;
    if (opts.onlyLargeContext && !opts.onlyLargeContext(model)) return false;
    if (opts.onlyCode && !opts.onlyCode(model)) return false;

    // Preset-Kompatibilität prüfen
    if (preset && preset.compatibleModels.length > 0 && !preset.compatibleModels.includes("*")) {
      if (!preset.compatibleModels.includes(modelId)) {
        return false; // Modell nicht in der Whitelist
      }
    }
    
    // Text-Suche (in ID und Name)
    if (searchText) {
      const searchableText = (modelId + " " + modelName).toLowerCase();
      if (!searchableText.includes(searchText)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Erkennt uncensored Modelle basierend auf bekannten Mustern
 */
export function isUncensoredModel(model: ModelInfo): boolean {
  const id = String(model?.id ?? "").toLowerCase();
  const name = String(model?.name ?? "").toLowerCase();
  
  // Explizit uncensored Keywords
  if (/uncensored|venice.*free|dolphin.*venice/i.test(id)) return true;
  if (/uncensored/i.test(name)) return true;
  
  // Bekannte uncensored Model-Familien
  if (/dolphin|cognitive.*computations/i.test(id)) return true;
  if (/hermes.*3|nous.*hermes/i.test(id)) return true;
  if (/anubis|lumimaid|skyfall|rocinante|unslopnemo/i.test(id)) return true;
  if (/wizard.*uncensored|mixtral.*uncensored/i.test(id)) return true;
  
  return false;
}

/**
 * Bestimmt das Zensur-Level eines Modells (0-4 Scale)
 */
export function getCensorshipLevel(model: ModelInfo): "none" | "minimal" | "low" | "medium" | "high" {
  const id = String(model?.id ?? "").toLowerCase();
  
  // Venice: 2.2% refusal rate - praktisch keine Zensur
  if (/venice.*uncensored/i.test(id)) return "none";
  
  // Dolphin Serie: explizit uncensored
  if (/dolphin.*cognitive|cognitive.*dolphin/i.test(id)) return "none";
  
  // Hermes 3: neutrally-aligned, sehr wenig Zensur
  if (/hermes.*3/i.test(id)) return "minimal";
  
  // Andere bekannte uncensored Modelle
  if (isUncensoredModel(model)) return "minimal";
  
  // Open-Source Modelle haben meist weniger Zensur
  if (/llama|mistral|mixtral/i.test(id) && !/openai|anthropic/i.test(id)) return "low";
  
  // Mainstream kommerzielle Modelle haben hohe Zensur
  if (/gpt-4|claude|gemini/i.test(id)) return "high";
  
  return "medium"; // Default
}

/**
 * Prüft ob ein Modell kostenlos ist
 */
export function isFreeModel(model: ModelInfo): boolean {
  // Prüfe verschiedene Pricing-Strukturen
  const pricing = model?.pricing ?? model?.price ?? null;
  if (!pricing) return false;
  
  // Rekursiv alle numerischen Werte sammeln
  const nums: number[] = [];
  const collectNumbers = (obj: any): void => {
    if (!obj) return;
    
    if (typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === "number") {
          nums.push(value);
        } else if (typeof value === "object") {
          collectNumbers(value);
        } else if (typeof value === "string") {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) nums.push(parsed);
        }
      }
    }
  };
  
  collectNumbers(pricing);
  
  // Alle gefundenen Zahlen müssen 0 sein
  if (nums.length === 0) return false;
  return nums.every(n => n === 0);
}

/**
 * Prüft ob ein Modell als "schnell" gilt
 */
export function isFastModel(model: ModelInfo): boolean {
  const id = String(model?.id ?? "").toLowerCase();
  const name = String(model?.name ?? "").toLowerCase();
  
  // Bekannte Fast-Model Patterns
  if (/mini|flash|small|fast|lite|turbo/i.test(id)) return true;
  if (/mini|flash|small|fast|lite|turbo/i.test(name)) return true;
  if (/o4-mini|gpt-3\.5|claude.*haiku/i.test(id)) return true;
  
  return false;
}

/**
 * Prüft ob ein Modell großen Kontext unterstützt (>= 100k tokens)
 */
export function isLargeContextModel(model: ModelInfo): boolean {
  const contextLength = Number(model?.context_length ?? model?.contextLength ?? 0);
  if (contextLength >= 100_000) return true;
  
  const id = String(model?.id ?? "").toLowerCase();
  // Bekannte Large-Context Patterns
  return /(128k|200k|1m|2m|long|pro|large)/i.test(id);
}

/**
 * Prüft ob ein Modell für Coding optimiert ist  
 */
export function isCodeModel(model: ModelInfo): boolean {
  const id = String(model?.id ?? "").toLowerCase();
  const name = String(model?.name ?? "").toLowerCase();
  
  const codePatterns = /coder|code|starcoder|qwen.*coder|deepseek.*coder|replit|codellama|copilot/i;
  return codePatterns.test(id) || codePatterns.test(name);
}

/**
 * Erstellt benutzerfreundliches Label für Modell-Anzeige
 */
export function getModelLabel(model: ModelInfo): string {
  const name = model?.name || model?.id || "unknown";
  const id = model?.id || "";
  
  // Kürze sehr lange Namen für bessere UI
  if (name.length > 60) {
    const shortName = id.split('/').pop() || name;
    return shortName.length < name.length ? shortName : name.slice(0, 57) + "...";
  }
  
  return name;
}

/**
 * Kategorisiert Modell basierend auf Eigenschaften
 */
export function categorizeModel(model: ModelInfo): string[] {
  const categories: string[] = [];
  
  if (isFreeModel(model)) categories.push("free");
  if (isFastModel(model)) categories.push("fast");
  if (isLargeContextModel(model)) categories.push("large-context");
  if (isCodeModel(model)) categories.push("code");
  if (isUncensoredModel(model)) categories.push("uncensored");
  
  const level = getCensorshipLevel(model);
  if (level === "none" || level === "minimal") categories.push("unrestricted");
  
  return categories;
}

/**
 * Berechnet Kompatibilitäts-Score zwischen Model und Preset (0-1)
 */
export function getCompatibilityScore(model: ModelInfo, preset: PersonaPreset): number {
  const modelId = String(model?.id ?? "");
  
  // Perfekte Kompatibilität wenn explizit gelistet
  if (preset.compatibleModels.includes(modelId)) return 1.0;
  if (preset.compatibleModels.includes("*")) return 0.8;
  
  // Scoring basierend auf Content-Level
  const isUncensored = isUncensoredModel(model);
  const censorshipLevel = getCensorshipLevel(model);
  
  switch (preset.contentLevel) {
    case "unlimited":
      if (censorshipLevel === "none") return 0.9;
      if (censorshipLevel === "minimal" && isUncensored) return 0.7;
      return 0.1;
      
    case "adult":
      if (censorshipLevel === "none" || censorshipLevel === "minimal") return 0.8;
      if (censorshipLevel === "low") return 0.5;
      return 0.2;
      
    case "mature":
      if (censorshipLevel === "high") return 0.3;
      return 0.7;
      
    case "safe":
      if (censorshipLevel === "high") return 1.0;
      if (censorshipLevel === "medium") return 0.8;
      return 0.4;
      
    default:
      return 0.5;
  }
}

/**
 * Sortiert Modelle nach Kompatibilität mit Preset
 */
export function sortModelsByCompatibility<T extends ModelInfo>(
  models: T[],
  preset: PersonaPreset
): T[] {
  return [...models].sort((a, b) => {
    const scoreA = getCompatibilityScore(a, preset);
    const scoreB = getCompatibilityScore(b, preset);
    return scoreB - scoreA; // Absteigend sortieren
  });
}
