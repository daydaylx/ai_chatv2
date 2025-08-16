export type ThemeMode = "system" | "light" | "dark";

export interface StylePreset {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  systemPrompt: string;
  temperature: number;   // 0..2 (optional nutzbar)
  topP: number;          // 0..1
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}
