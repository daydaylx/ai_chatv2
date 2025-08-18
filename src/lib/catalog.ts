import * as React from "react";
import type { PersonaModel } from "../entities/persona";
import type { OpenRouterModel } from "./openrouter";
import { OpenRouterClient } from "./openrouter";

/** UI-Shape für den Picker (kein Schema-Change an personas.json) */
export type ModelVM = {
  id: string;
  name?: string;
  label?: string;
  description?: string;
  ctx?: number;
  context?: number;
  tags?: string[];
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
};

type UseModelCatalogOpts = {
  local: PersonaModel[];
  apiKey?: string | null;
  /** Cache-Lebensdauer in Minuten (default 60) */
  ttlMin?: number;
};

type State =
  | { status: "loading"; models: ModelVM[]; error: null }
  | { status: "ready"; models: ModelVM[]; error: null }
  | { status: "error"; models: ModelVM[]; error: string };

const LS_KEY = "model_catalog_cache_v1";

export function useModelCatalog(opts: UseModelCatalogOpts) {
  const { local, apiKey, ttlMin = 60 } = opts;
  const [st, setSt] = React.useState<State>({ status: "loading", models: [], error: null });

  const load = React.useCallback(async (force = false) => {
    setSt(s => ({ ...s, status: "loading" as const }));
    try {
      const cached = readCache(ttlMin);
      const remote = force || !cached
        ? await fetchRemote(apiKey ?? undefined)
        : cached;

      if (!cached && remote) writeCache(remote);

      const merged = mergeLocalRemote(normalizeLocal(local), remote ?? []);
      setSt({ status: "ready", models: merged, error: null });
    } catch (e: any) {
      // Fallback: zeige zumindest lokal normalisierte Modelle
      const merged = mergeLocalRemote(normalizeLocal(local), []);
      setSt({ status: "error", models: merged, error: String(e?.message ?? e) });
    }
  }, [apiKey, local, ttlMin]);

  React.useEffect(() => { load(false); }, [load]);

  return {
    status: st.status,
    error: st.error,
    models: st.models,
    refresh: () => load(true),
    hasRemote: !!readCache(ttlMin),
  };
}

/* ---------------- intern ---------------- */

function normalizeLocal(list: PersonaModel[]): ModelVM[] {
  return list.map((m) => {
    // Suffixe wie ":free:fast" abtrennen und Flags setzen.
    const { baseId, flags } = splitIdFlags(m.id);
    const vm: ModelVM = {
      id: baseId,
      name: m.name,
      label: m.label,
      description: m.description,
      ctx: m.ctx ?? m.context,
      context: m.context ?? m.ctx,
      tags: Array.isArray(m.tags) ? [...m.tags] : [],
      free: m.free || flags.free,
      fast: m.fast || flags.fast,
      allow_nsfw: m.allow_nsfw || flags.allow_nsfw,
    };
    if (flags.tags.length) vm.tags = [...(vm.tags ?? []), ...flags.tags];
    return vm;
  });
}

function splitIdFlags(rawId: string): { baseId: string; flags: { free: boolean; fast: boolean; allow_nsfw: boolean; tags: string[] } } {
  if (!rawId.includes(":")) return { baseId: rawId, flags: { free: false, fast: false, allow_nsfw: false, tags: [] } };
  const parts = rawId.split(":");
  const baseId = parts[0];
  const rest = parts.slice(1).map(s => s.trim().toLowerCase()).filter(Boolean);
  const flags = { free: false, fast: false, allow_nsfw: false, tags: [] as string[] };
  for (const t of rest) {
    if (t === "free") flags.free = true;
    else if (t === "fast") flags.fast = true;
    else if (t === "nsfw" || t === "allow_nsfw" || t === "18+") flags.allow_nsfw = true;
    else flags.tags.push(t);
  }
  return { baseId, flags };
}

async function fetchRemote(apiKey?: string): Promise<OpenRouterModel[]> {
  const client = new OpenRouterClient(apiKey ? { apiKey } : undefined);
  const list = await client.listModels();
  return Array.isArray(list) ? list : [];
}

function mergeLocalRemote(local: ModelVM[], remote: OpenRouterModel[]): ModelVM[] {
  const rmap = new Map<string, OpenRouterModel>();
  for (const r of remote) if (r?.id) rmap.set(r.id, r);

  const seen = new Set<string>();
  const out: ModelVM[] = [];

  // 1) Lokale zuerst (IDs bleiben stabil), Remote reichert an
  for (const m of local) {
    const r = rmap.get(m.id);
    const merged = enrich(m, r);
    out.push(merged);
    seen.add(m.id);
  }

  // 2) Remote-exklusive nachschieben
  for (const r of remote) {
    if (!r?.id || seen.has(r.id)) continue;
    out.push(enrich({ id: r.id }, r));
  }

  // 3) Sortierung: Favoriten macht UI – hier nur alphabetisch by name/label/id
  return out.sort((a, b) => displayName(a).localeCompare(displayName(b)));
}

function displayName(m: ModelVM): string {
  return (m.label ?? m.name ?? m.id).toLowerCase();
}

function enrich(base: ModelVM, r?: OpenRouterModel): ModelVM {
  const vm: ModelVM = { ...base };
  if (r) {
    vm.name = vm.name ?? r.name ?? undefined;
    vm.description = vm.description ?? r.description ?? undefined;
    const ctx = (r as any)?.context_length;
    vm.ctx = vm.ctx ?? (typeof ctx === "number" ? ctx : undefined);
    vm.context = vm.context ?? (typeof ctx === "number" ? ctx : undefined);

    // Free-Heuristik aus pricing: wenn alle Werte fehlen oder <= 0 → free
    const p = (r as any)?.pricing;
    const nums: number[] = [];
    for (const k of ["prompt", "completion"]) {
      const v = p?.[k];
      if (typeof v === "number") nums.push(v);
      else if (typeof v === "string") {
        const f = parseFloat(v);
        if (!Number.isNaN(f)) nums.push(f);
      }
    }
    if (nums.length) {
      const isFree = nums.every(n => n <= 0);
      vm.free = vm.free || isFree;
    }

    // Fast-Heuristik: turbo/small/7b/8b → eher schnell
    const rid = r.id.toLowerCase();
    if (/turbo|small|mini|7b|8b/.test(rid)) vm.fast = vm.fast ?? true;

    // NSFW: leider nicht standardisiert; belasse lokale flags, füge Tag wenn bekannt
    vm.tags = vm.tags ?? [];
  }
  return vm;
}

/* -------------- Cache -------------- */
type CacheBlob = { ts: number; data: OpenRouterModel[] };

function readCache(ttlMin: number): OpenRouterModel[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const blob: CacheBlob = JSON.parse(raw);
    if (!blob || typeof blob.ts !== "number" || !Array.isArray(blob.data)) return null;
    const ageMin = (Date.now() - blob.ts) / 60000;
    if (ageMin > ttlMin) return null;
    return blob.data;
  } catch { return null; }
}
function writeCache(data: OpenRouterModel[]) {
  try {
    const blob: CacheBlob = { ts: Date.now(), data };
    localStorage.setItem(LS_KEY, JSON.stringify(blob));
  } catch {}
}
