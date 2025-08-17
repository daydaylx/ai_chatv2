export interface PersonaStyle {
  id: string;
  name: string;
  system: string;
  allow?: string[];
  deny?: string[];
}

export interface PersonaModel {
  id: string;
  label: string;
  tags?: string[];
  context?: number;
}

export interface PersonaData {
  models: PersonaModel[];
  styles: PersonaStyle[];
}

// Lade Persona-Daten aus JSON
export async function loadPersonaData(): Promise<PersonaData> {
  try {
    const response = await fetch('/persona.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to load persona.json:', error);
    
    // Fallback: leere Daten
    return {
      models: [],
      styles: [{
        id: 'fallback',
        name: 'Standard',
        system: 'Du bist ein hilfsbereiter Assistent.'
      }]
    };
  }
}

// Style-Filter basierend auf allow/deny patterns
export function isModelAllowedForStyle(modelId: string, style: PersonaStyle): boolean {
  // Kein Filter = alle erlaubt
  if (!style.allow && !style.deny) return true;
  
  // Wenn allow definiert ist, muss Model darin sein
  if (style.allow) {
    return style.allow.some(pattern => matchesPattern(modelId, pattern));
  }
  
  // Wenn nur deny definiert ist, muss Model NICHT darin sein
  if (style.deny) {
    return !style.deny.some(pattern => matchesPattern(modelId, pattern));
  }
  
  return true;
}

// Glob-Pattern Matching (vereinfacht)
function matchesPattern(text: string, pattern: string): boolean {
  // Escape special regex chars except * und ?
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
    
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(text);
}

// Get filtered models für einen Style
export function getModelsForStyle(models: PersonaModel[], style: PersonaStyle): PersonaModel[] {
  return models.filter(model => isModelAllowedForStyle(model.id, style));
}
