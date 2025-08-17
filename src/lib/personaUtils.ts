import type { PersonaModel, PersonaStyle } from "../entities/persona";
import { globAny } from "./glob";

export function isModelAllowedForStyle(modelId: string, style: PersonaStyle | null): boolean {
  if (!style) return true;
  const hasAllow = Array.isArray(style.allow) && style.allow.length > 0;
  const hasDeny  = Array.isArray(style.deny) && style.deny.length > 0;
  if (hasAllow && !globAny(style.allow!, modelId)) return false;
  if (hasDeny  &&  globAny(style.deny!,  modelId)) return false;
  return true;
}

/** Wählt ein erstes erlaubtes Modell (oder null) */
export function pickFirstAllowedModel(models: PersonaModel[], style: PersonaStyle | null): string | null {
  for (const m of models) {
    if (isModelAllowedForStyle(m.id, style)) return m.id;
  }
  return null;
}
