// Schlanke, regelbasierte Extraktion aus Chatturns – keine Dependencies.
// Fokus: Präferenzen, Stil, Sprache, Format, "merke dir …", Rollen/Anrede.
// KEINE sensiblen personenbezogenen Daten (Adresse, Telefonnummer, etc.).

export type ExtractCandidate = {
  text: string;
  tags: string[];
  ttlDays?: number | null;
  confidence?: number; // 0..1
};

/** Normalisiert Text für Regex-Prüfungen */
function norm(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/** True, wenn String nach PII/Unfug riecht (einfacher Schutz) */
function looksSensitive(s: string) {
  // Telefonnummern/IBAN/Adressen o.ä. grob filtern
  if (/\b\d{9,}\b/.test(s)) return true; // lange Ziffernkolonnen
  if (/\b(?:iban|bic|konto|bank|adresse|street|straße)\b/i.test(s)) return true;
  return false;
}

/** Extrahiert Kandidaten aus User/Assistant-Texten */
export function extractFromChat(userText: string, assistantText?: string): ExtractCandidate[] {
  const out: ExtractCandidate[] = [];
  const u = norm(userText);
  const a = assistantText ? norm(assistantText) : "";

  // --- HARTE "Merke dir" Muster (de/en) ---
  // "merke dir: …" | "merk dir …" | "remember that …"
  const md = /\b(?:merke?\s*dir|remember\s+that)\s*[:\-–]?\s*(.{6,220})/i.exec(u);
  if (md && !looksSensitive(md[1])) {
    out.push({ text: md[1], tags: ["pin", "user"], ttlDays: 30, confidence: 0.9 });
  }

  // --- Sprache ---
  if (/\bauf\s+deutsch\b/i.test(u) || /\bantwort(e)?\s+auf\s+deutsch\b/i.test(u)) {
    out.push({ text: "Bevorzugte Sprache: Deutsch", tags: ["language", "preference"], ttlDays: 180, confidence: 0.9 });
  }
  if (/\b(in|auf)\s+englisch|english\b/i.test(u)) {
    out.push({ text: "Bevorzugte Sprache: Englisch", tags: ["language", "preference"], ttlDays: 180, confidence: 0.8 });
  }

  // --- Ton/Länge ---
  if (/\b(antworte|bitte)\s+(kurz|prägnant)\b/i.test(u)) {
    out.push({ text: "Antwortlänge: kurz/prägnant", tags: ["style", "preference"], ttlDays: 90, confidence: 0.85 });
  }
  if (/\b(antworte|bitte)\s+(lang|detailliert|ausführlich)\b/i.test(u)) {
    out.push({ text: "Antwortlänge: lang/detailliert", tags: ["style", "preference"], ttlDays: 90, confidence: 0.85 });
  }

  // --- Anrede ---
  if (/\bduz(e|en)?\s*mich|bitte\s*mich\s*duzen\b/i.test(u)) {
    out.push({ text: "Anrede-Form: Du", tags: ["preference", "style"], ttlDays: 365, confidence: 0.9 });
  }
  if (/\bsiez(e|en)?\s*mich|bitte\s*mich\s*siezen\b/i.test(u)) {
    out.push({ text: "Anrede-Form: Sie", tags: ["preference", "style"], ttlDays: 365, confidence: 0.9 });
  }

  // --- Anrede-Name ---
  const nick = /\b(?:nenn(?:\s*mich)?|sprich\s*mich\s*an\s*als)\s+([A-Za-zÀ-ÿ0-9_\-]{2,24})\b/i.exec(u);
  if (nick) {
    out.push({ text: `Anrede: ${nick[1]}`, tags: ["preference", "name"], ttlDays: 365, confidence: 0.9 });
  }

  // --- Format ---
  const fmt = /\b(?:format|ausgabe|output)\s*[:\-–]\s*(.{4,140})/i.exec(u);
  if (fmt && !looksSensitive(fmt[1])) {
    out.push({ text: `Bevorzugtes Format: ${fmt[1]}`, tags: ["format", "preference"], ttlDays: 120, confidence: 0.8 });
  }

  // --- Modellpräferenz (nur Hinweis) ---
  const mp = /\b(?:benutze|nimm|nutze)\s+(?:immer\s+)?(?:modell|model)\s+([A-Za-z0-9_\-\/\.:]{3,64})\b/i.exec(u);
  if (mp) {
    out.push({ text: `Modellpräferenz: ${mp[1]}`, tags: ["model_pref"], ttlDays: 120, confidence: 0.6 });
  }

  // --- Aufgaben-/Kontext-Pin aus Assistant (z. B. „Zusammenfassung: …“) ---
  const sumA = /\b(?:kurzfassung|zusammenfassung|summary)\s*[:\-–]\s*(.{12,240})/i.exec(a);
  if (sumA && !looksSensitive(sumA[1])) {
    out.push({ text: `Kontext: ${sumA[1]}`, tags: ["summary", "context"], ttlDays: 14, confidence: 0.7 });
  }

  // Dedupe auf Basis des Textes
  const seen = new Set<string>();
  return out.filter(c => {
    const key = c.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
