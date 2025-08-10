import type { PersonaPreset } from "./presets";
import { applyTheme, type ThemeId } from "./theme";

export function persistModel(id: string): boolean { try { localStorage.setItem("model", id); return true; } catch { return false; } }
export function persistPreset(id: string): boolean { try { localStorage.setItem("persona_preset_id", id); return true; } catch { return false; } }
export function persistTheme(id: string): boolean { try { localStorage.setItem("theme", id); return true; } catch { return false; } }

export interface AutoSetupActions {
  setPresetId?: (id: string) => void;
  setPersona?: (p: PersonaPreset) => void;
  setModel?: (id: string) => void;
  setThemeId?: (id: ThemeId) => void;
  setShowPersona?: (show: boolean) => void;
  setError?: (error: string | null) => void;
  onSuccess?: (preset: PersonaPreset) => void;
}

export interface AutoSetupResult {
  success: boolean;
  preset: PersonaPreset;
  changes: { persona: boolean; model: boolean; theme: boolean; };
  errors: string[];
}

export function autoSetup(preset: PersonaPreset, actions: AutoSetupActions): AutoSetupResult {
  const result: AutoSetupResult = { success: true, preset, changes: { persona: false, model: false, theme: false }, errors: [] };

  try {
    if (actions.setPersona) { actions.setPersona(preset); result.changes.persona = true; }
    if (actions.setPresetId) { actions.setPresetId(preset.id); if (!persistPreset(preset.id)) result.errors.push("Preset konnte nicht gespeichert werden"); }

    if (preset.autoModel && actions.setModel) {
      actions.setModel(preset.autoModel);
      if (!persistModel(preset.autoModel)) result.errors.push("Modell konnte nicht gespeichert werden");
      result.changes.model = true;
    }

    if (preset.autoTheme) {
      if (actions.setThemeId) actions.setThemeId(preset.autoTheme);
      applyTheme(preset.autoTheme);
      if (!persistTheme(preset.autoTheme)) result.errors.push("Theme konnte nicht gespeichert werden");
      result.changes.theme = true;
    }

    if (actions.setShowPersona) actions.setShowPersona(false);
    if (actions.setError) actions.setError(null);
    if (actions.onSuccess) actions.onSuccess(preset);

    try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40); } catch {}
  } catch (e) {
    result.success = false;
    result.errors.push(e instanceof Error ? e.message : String(e));
    if (actions.setError) actions.setError("Auto-Setup fehlgeschlagen.");
  }

  return result;
}

export function isPresetCompatible(preset: PersonaPreset, currentModel: string): boolean {
  return preset.compatibleModels.includes("*") || preset.compatibleModels.includes(currentModel);
}

export function getRecommendedModelForPreset(preset: PersonaPreset): string | null {
  if (preset.autoModel) return preset.autoModel;
  if (preset.compatibleModels.length > 0 && preset.compatibleModels[0] !== "*") {
    return preset.compatibleModels[0] || null;
  }
  return null;
}
