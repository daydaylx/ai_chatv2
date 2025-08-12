import { builtinStyles, type StyleTemplate } from "../features/styles/templates";
import { loadRepoTemplates } from "../features/styles/templates.auto";

const LS_STYLE_ID = "style_id";
const LS_STYLES_CUSTOM = "styles_custom";

function readCustom(): StyleTemplate[] {
  try {
    const raw = localStorage.getItem(LS_STYLES_CUSTOM);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => x && typeof x.id === "string");
  } catch {
    return [];
  }
}

function writeCustom(list: StyleTemplate[]) {
  localStorage.setItem(LS_STYLES_CUSTOM, JSON.stringify(list));
}

export function listBuiltins(): StyleTemplate[] {
  return builtinStyles.slice();
}

export function listRepo(): StyleTemplate[] {
  // Buildzeit-lokal: keine I/O zur Laufzeit
  try {
    return loadRepoTemplates();
  } catch {
    return [];
  }
}

export function listCustom(): StyleTemplate[] {
  return readCustom();
}

export function listAll(): StyleTemplate[] {
  // Reihenfolge: Built-ins < Repo-Overrides (per id) < Custom
  const base = new Map<string, StyleTemplate>();
  for (const s of listBuiltins()) base.set(s.id, s);
  for (const s of listRepo()) base.set(s.id, s);
  for (const s of listCustom()) base.set(s.id, s);
  return Array.from(base.values());
}

export function getStyleId(): string {
  return localStorage.getItem(LS_STYLE_ID) || "";
}

export function setStyleId(id: string) {
  localStorage.setItem(LS_STYLE_ID, id);
}

export function getById(id: string): StyleTemplate | undefined {
  return listAll().find((s) => s.id === id);
}

export function getCurrent(): StyleTemplate | undefined {
  const id = getStyleId();
  return getById(id) || listBuiltins()[0];
}

function genId(name: string) {
  return (
    "custom-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export function upsertCustom(tpl: Omit<StyleTemplate, "builtin" | "id"> & { id?: string }): StyleTemplate {
  const list = readCustom();
  let id = tpl.id || genId(tpl.name || "style");
  const idx = list.findIndex((x) => x.id === id);
  const normalized: StyleTemplate = { ...tpl, id, builtin: false };
  if (idx >= 0) list[idx] = normalized;
  else list.push(normalized);
  writeCustom(list);
  return normalized;
}

export function removeCustom(id: string) {
  const list = readCustom().filter((x) => x.id !== id);
  writeCustom(list);
}

export function exportCustom(): string {
  return JSON.stringify({ styles: readCustom() }, null, 2);
}

export async function importCustomFromFile(file: File): Promise<number> {
  const text = await file.text();
  const json = JSON.parse(text);
  const arr = Array.isArray(json?.styles) ? json.styles : Array.isArray(json) ? json : [];
  if (!Array.isArray(arr)) return 0;
  let count = 0;
  for (const tpl of arr) {
    if (tpl && typeof tpl.name === "string" && typeof tpl.system === "string") {
      upsertCustom(tpl);
      count++;
    }
  }
  return count;
}
