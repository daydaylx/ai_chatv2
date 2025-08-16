import type { StylePreset, ThemeMode } from "@/types";

const STYLE_KEY = "stylePresets:v1";
const THEME_KEY = "theme:v1";

export function loadPresets(): StylePreset[] {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StylePreset[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function savePresets(presets: StylePreset[]) {
  localStorage.setItem(STYLE_KEY, JSON.stringify(presets));
}

export function importPresetsFromJson(json: string): StylePreset[] {
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error("Ungültiges Preset-Format.");
  // Minimale Validierung
  for (const p of data) {
    if (!p.id || !p.name || typeof p.systemPrompt !== "string") {
      throw new Error("Ein Preset ist unvollständig.");
    }
  }
  return data;
}

export function exportPresetsToJson(presets: StylePreset[]): string {
  return JSON.stringify(presets, null, 2);
}

export function loadTheme(): ThemeMode {
  const v = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  return v ?? "system";
}

export function saveTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
}
