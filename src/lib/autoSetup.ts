import type { PersonaPreset } from "./presets";
import { applyTheme, type ThemeId } from "./theme";

/**
 * Persistierungs-Funktionen mit robustem Error-Handling
 */
export function persistModel(id: string): boolean {
  try { 
    localStorage.setItem("model", id); 
    return true;
  } catch (error) {
    console.warn("Failed to persist model:", error);
    return false;
  }
}

export function persistPreset(id: string): boolean {
  try { 
    localStorage.setItem("persona_preset_id", id); 
    return true;
  } catch (error) {
    console.warn("Failed to persist preset:", error);
    return false;
  }
}

export function persistTheme(id: string): boolean {
  try { 
    localStorage.setItem("theme", id); 
    return true;
  } catch (error) {
    console.warn("Failed to persist theme:", error);
    return false;
  }
}

/**
 * Action-Interface für Auto-Setup
 */
export interface AutoSetupActions {
  setPresetId?: (id: string) => void;
  setPersona?: (p: PersonaPreset) => void;
  setModel?: (id: string) => void;
  setThemeId?: (id: ThemeId) => void;
  setShowPersona?: (show: boolean) => void;
  setError?: (error: string | null) => void;
  onSuccess?: (preset: PersonaPreset) => void;
}

/**
 * Auto-Setup Result für besseres Error-Handling
 */
export interface AutoSetupResult {
  success: boolean;
  preset: PersonaPreset;
  changes: {
    persona: boolean;
    model: boolean;
    theme: boolean;
  };
  errors: string[];
}

/**
 * Hauptfunktion: Koordiniert Preset, Modell und Theme automatisch
 */
export function autoSetup(
  preset: PersonaPreset,
  actions: AutoSetupActions
): AutoSetupResult {
  const result: AutoSetupResult = {
    success: true,
    preset,
    changes: { persona: false, model: false, theme: false },
    errors: []
  };

  console.log(`🎯 Auto-Setup gestartet für: ${preset.label}`);
  
  try {
    // 1. Preset setzen
    if (actions.setPersona) {
      actions.setPersona(preset);
      result.changes.persona = true;
      console.log(`✅ Persona gesetzt: ${preset.label}`);
    }
    
    if (actions.setPresetId) {
      actions.setPresetId(preset.id);
      const persisted = persistPreset(preset.id);
      if (!persisted) {
        result.errors.push("Preset konnte nicht gespeichert werden");
      }
      console.log(`✅ Preset-ID ${persisted ? 'persistiert' : 'gesetzt'}: ${preset.id}`);
    }

    // 2. Auto-Modell setzen (falls verfügbar)
    if (preset.autoModel && actions.setModel) {
      actions.setModel(preset.autoModel);
      const persisted = persistModel(preset.autoModel);
      result.changes.model = true;
      
      if (!persisted) {
        result.errors.push("Modell konnte nicht gespeichert werden");
      }
      
      console.log(`📱 Modell ${persisted ? 'persistiert' : 'gesetzt'}: ${preset.autoModel}`);
    } else if (preset.autoModel) {
      console.log(`⚠️ Auto-Modell verfügbar (${preset.autoModel}), aber kein setModel Handler`);
    }

    // 3. Auto-Theme setzen (falls verfügbar)  
    if (preset.autoTheme) {
      if (actions.setThemeId) {
        actions.setThemeId(preset.autoTheme);
      }
      
      applyTheme(preset.autoTheme);
      const persisted = persistTheme(preset.autoTheme);
      result.changes.theme = true;
      
      if (!persisted) {
        result.errors.push("Theme konnte nicht gespeichert werden");
      }
      
      console.log(`🎨 Theme ${persisted ? 'persistiert' : 'gesetzt'}: ${preset.autoTheme}`);
    } else {
      console.log(`ℹ️ Kein Auto-Theme definiert für: ${preset.label}`);
    }

    // 4. UI Management
    if (actions.setShowPersona) {
      actions.setShowPersona(false);
    }
    
    if (actions.setError) {
      actions.setError(null); // Clear previous errors
    }

    // 5. Success Callback
    if (actions.onSuccess) {
      actions.onSuccess(preset);
    }

    // 6. Haptic Feedback für mobile Devices
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch {
      // Ignore vibration errors
    }

    const changesCount = Object.values(result.changes).filter(Boolean).length;
    console.log(`🎉 Auto-Setup erfolgreich: ${changesCount} Änderungen für "${preset.label}"`);
    
  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    
    console.error("Auto-Setup fehlgeschlagen:", error);
    
    if (actions.setError) {
      actions.setError(`Auto-Setup fehlgeschlagen: ${errorMessage}`);
    }
  }

  return result;
}

/**
 * Prüft ob ein Preset mit dem aktuellen Modell kompatibel ist
 */
export function isPresetCompatible(preset: PersonaPreset, currentModel: string): boolean {
  if (preset.compatibleModels.includes("*")) {
    return true; // Alle Modelle erlaubt
  }
  
  return preset.compatibleModels.includes(currentModel);
}

/**
 * Findet das beste empfohlene Modell für ein Preset
 */
export function getRecommendedModelForPreset(preset: PersonaPreset): string | null {
  // 1. Auto-Modell bevorzugen (optimale Wahl)
  if (preset.autoModel) {
    return preset.autoModel;
  }
  
  // 2. Erstes kompatibles Modell (falls keine Wildcard)
  if (preset.compatibleModels.length > 0 && preset.compatibleModels[0] !== "*") {
    return preset.compatibleModels;
  }
  
  return null;
}

/**
 * Erstellt Setup-Info für UI-Anzeige
 */
export interface SetupInfo {
  hasAutoSetup: boolean;
  autoModel?: string;
  autoTheme?: string;
  modelName?: string;
  description: string;
  changeCount: number;
}

export function getSetupInfo(preset: PersonaPreset): SetupInfo {
  const hasAutoSetup = !!(preset.autoModel || preset.autoTheme);
  let changeCount = 0;
  
  if (preset.autoModel) changeCount++;
  if (preset.autoTheme) changeCount++;
  
  let description = "";
  const parts: string[] = [];
  
  if (preset.autoModel) {
    const modelName = preset.autoModel.split('/')[1] || preset.autoModel;
    parts.push(`${modelName}`);
  }
  
  if (preset.autoTheme) {
    parts.push(`${preset.autoTheme} theme`);
  }
  
  if (parts.length > 0) {
    description = parts.join(" + ");
  } else {
    description = "Nur System-Prompt";
  }
  
  return {
    hasAutoSetup,
    autoModel: preset.autoModel,
    autoTheme: preset.autoTheme,
    modelName: preset.autoModel?.split('/')[1] || undefined,
    description,
    changeCount
  };
}

/**
 * Validiert Auto-Setup Konfiguration
 */
export function validateAutoSetup(preset: PersonaPreset): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Prüfe ob uncensored Preset mit zensiertem Default-Modell
  if ((preset.contentLevel === "adult" || preset.contentLevel === "unlimited")) {
    if (!preset.autoModel) {
      warnings.push(`${preset.label} benötigt uncensored Modell, hat aber kein autoModel gesetzt`);
    }
  }
  
  // Prüfe ob Theme zur Content-Level passt
  if (preset.contentLevel === "adult" && preset.autoTheme !== "red") {
    warnings.push(`Adult-Content Preset sollte 'red' Theme verwenden`);
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Batch Auto-Setup für mehrere Presets (für Testing/Setup)
 */
export async function batchAutoSetup(
  presets: PersonaPreset[], 
  actions: AutoSetupActions,
  delayMs = 100
): Promise<AutoSetupResult[]> {
  const results: AutoSetupResult[] = [];
  
  for (const preset of presets) {
    const result = autoSetup(preset, actions);
    results.push(result);
    
    // Kurze Pause zwischen Setups
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
