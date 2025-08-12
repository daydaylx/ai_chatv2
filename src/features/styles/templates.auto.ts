import type { StyleTemplate } from "./templates";

/** Sucht im Repo nach Stil-Definitionen unter src/**/(styles|templates|personas).(ts|js|json) */
export function loadRepoTemplates(): StyleTemplate[] {
  // Vite: eager-Import, kein dynamic import zur Laufzeit
  // JSON/TS/JS werden als any behandelt – wir parsen defensiv.
  // @ts-ignore - Vite-Typen liefern any für mixed Globs
  const mods: Record<string, any> = import.meta.glob(
    [
      "/src/**/styles.{ts,js,json}",
      "/src/**/templates.{ts,js,json}",
      "/src/**/personas.{ts,js,json}",
      "/src/features/**/repo-templates.{ts,js,json}",
    ],
    { eager: true }
  );

  const out: StyleTemplate[] = [];
  const seen = new Set<string>();

  const normId = (name: string, idx: number) =>
    ("repo-" +
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) +
      "-" +
      idx);

  const coerceTpl = (tpl: any, idx: number): StyleTemplate | null => {
    if (!tpl || typeof tpl !== "object") return null;
    const name = String(tpl.name ?? tpl.id ?? "").trim();
    const system = String(tpl.system ?? "").trim();
    if (!name || !system) return null;
    const id = String(tpl.id ?? normId(name, idx));
    const params = tpl.params && typeof tpl.params === "object" ? tpl.params : undefined;
    return {
      id,
      name,
      summary: String(tpl.summary ?? "").trim(),
      system,
      params,
      builtin: false,
    };
  };

  const pushUnique = (tpl: StyleTemplate) => {
    if (seen.has(tpl.id)) return;
    seen.add(tpl.id);
    out.push(tpl);
  };

  let counter = 0;
  for (const [_path, m] of Object.entries(mods)) {
    // Mögliche Exporte: default=[...], {styles:[...]}, {templates:[...]}
    const arr =
      Array.isArray(m?.default) ? m.default :
      Array.isArray(m?.styles) ? m.styles :
      Array.isArray(m?.templates) ? m.templates :
      null;
    if (!arr) continue;
    for (const raw of arr) {
      const tpl = coerceTpl(raw, counter++);
      if (tpl) pushUnique(tpl);
    }
  }

  return out;
}
