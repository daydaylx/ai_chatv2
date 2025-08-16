import type { StylePreset } from "@/types";

export const defaultPresets: StylePreset[] = [
  {
    id: "klar-praezise",
    name: "Klar & Präzise",
    description: "Sachlich, knapp, ohne Floskeln. Fokus auf Fakten und Handlungsschritte.",
    tags: ["sachlich", "präzise", "knapp"],
    systemPrompt:
      "Du antwortest knapp, sachlich und ergebnisorientiert. Keine Floskeln, keine Ausschmückungen. Gliedere in klare Schritte, wenn sinnvoll.",
    temperature: 0.3,
    topP: 0.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "analytisch",
    name: "Analytisch & Strukturiert",
    description: "Analysen mit klarer Struktur, Risiken, Annahmen und Alternativen.",
    tags: ["analyse", "risiken", "entscheidungen"],
    systemPrompt:
      "Liefere eine klare Analyse mit: Ziel, Annahmen, Risiken, Optionen (mit Pros/Cons) und einer Empfehlung mit Begründung.",
    temperature: 0.4,
    topP: 0.85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "locker-freundlich",
    name: "Locker & Freundlich",
    description: "Entspannte, freundliche Tonalität. Umgänglich, aber hilfreich.",
    tags: ["freundlich", "locker"],
    systemPrompt:
      "Bleibe locker und freundlich, aber präzise. Kurze Sätze, keine Übertreibungen, klare Tipps.",
    temperature: 0.7,
    topP: 0.95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "kreativ-bildhaft",
    name: "Kreativ & Bildhaft",
    description: "Einprägsame Bilder und Analogien, ohne schwülstige Lyrik.",
    tags: ["kreativ", "bildhaft"],
    systemPrompt:
      "Nutze prägnante Bilder/Analogien sparsam, um komplexe Ideen zu verdeutlichen. Kein Kitsch, keine Floskeln.",
    temperature: 0.9,
    topP: 0.95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "nofilter",
    name: "NoFilter (direkt)",
    description: "Unverblümte, direkte Antworten. Keine Beschönigung.",
    tags: ["direkt", "schonungslos"],
    systemPrompt:
      "Antworte direkt, ohne Beschönigung. Benenne Risiken und Schwächen explizit. Kein Motivationssprech.",
    temperature: 0.5,
    topP: 0.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
