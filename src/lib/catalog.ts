import * as React from "react";
<<<<<<< HEAD

/** Modelltyp so definieren, wie SettingsSheet ihn nutzt */
export type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  /** Zusätzliche, im UI verwendete Flags (optional, defensiv) */
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
  tags?: string[];
};

export type CatalogStatus = "idle" | "loading" | "ready" | "error";

export type CatalogState = {
  models: OpenRouterModel[];
  loading: boolean;
  error: string | null;
  status: CatalogStatus;
  reload: () => void;
  refresh: () => void; // Alias
};

type UseCatalogOpts = {
  local?: OpenRouterModel[];
  apiKey?: string | null;
};

/** Einmalig die OpenRouter-Modelle per fetch laden (ohne Abhängigkeit zu openrouter.ts) */
async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  if (!apiKey) return [];
  const r = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": location.origin,
      "X-Title": "Disa AI",
      "Content-Type": "application/json"
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`OpenRouter: ${r.status} ${r.statusText}`);
  const j = await r.json();
  const raw = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);

  return raw.map((m: any) => {
    const model: OpenRouterModel = {
      id: String(m?.id ?? m?.name ?? ""),
      name: typeof m?.name === "string" ? m.name : undefined,
      description: typeof m?.description === "string" ? m.description : undefined,
      context_length: typeof m?.context_length === "number" ? m.context_length : undefined,
      pricing: m?.pricing && typeof m.pricing === "object"
        ? {
            prompt: typeof m.pricing.prompt === "string" ? m.pricing.prompt : undefined,
            completion: typeof m.pricing.completion === "string" ? m.pricing.completion : undefined,
          }
        : undefined,
      // Falls die API diese Felder liefert: übernehmen; sonst bleiben sie false/leer
      free: !!m?.free,
      allow_nsfw: !!m?.allow_nsfw,
      fast: !!m?.fast,
      tags: Array.isArray(m?.tags) ? m.tags.filter((t: any) => typeof t === "string") : undefined,
    };
    return model;
  }).filter((m: OpenRouterModel) => !!m.id);
}

export function useModelCatalog(opts?: UseCatalogOpts): CatalogState {
  // Stabil: local & apiKey separat memoizen (vermeidet exhaustive-deps-Warnungen)
  const localInput = opts?.local;
  const local = React.useMemo<OpenRouterModel[]>(() => localInput ?? [], [localInput]);

  const apiKeyInput = opts?.apiKey ?? null;
  const apiKey = React.useMemo<string>(() => (apiKeyInput ?? "") || "", [apiKeyInput]);

  const [models, setModels] = React.useState<OpenRouterModel[]>(local);
  const [loading, setLoading] = React.useState<boolean>(false);
=======
import { fetchModels, type ORModel } from "./openrouter";

export type CatalogModel = {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  free?: boolean;
  fast?: boolean;
  allow_nsfw?: boolean;
};

export function useModelCatalog({ local, apiKey }: { local: CatalogModel[]; apiKey: string | null; }) {
  const [models, setModels] = React.useState<CatalogModel[]>(local ?? []);
  const [loading, setLoading] = React.useState(false);
>>>>>>> origin/main
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<CatalogStatus>(local.length ? "ready" : "idle");

  const abortRef = React.useRef<AbortController | null>(null);

  const normalize = (m: ORModel): CatalogModel => {
    const id = m.id;
    const name = m.name ?? m.id;
    const description = m.description ?? "";
    const tags = m.tags ?? [];
    const free = /free|trial|open|test/i.test([id, name, description, tags.join(",")].join(" "));
    const fast = /fast|turbo|small|mini/i.test([id, name, description, tags.join(",")].join(" "));
    const allow_nsfw = /nsfw|uncensored|anything/i.test([id, name, description, tags.join(",")].join(" "));
    return { id, name, description, tags, free, fast, allow_nsfw };
  };

  const load = React.useCallback(async () => {
<<<<<<< HEAD
    if (!apiKey) {
      setModels(local);
      setError(null);
=======
    if (!apiKey) { setModels(local ?? []); setError(null); return; }
    setLoading(true); setError(null);
    try {
      const list = await fetchModels(apiKey);
      const norm = list.map(normalize);
      setModels(norm);
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Laden");
      setModels(local ?? []);
    } finally {
>>>>>>> origin/main
      setLoading(false);
      setStatus(local.length ? "ready" : "idle");
      return;
    }
<<<<<<< HEAD
=======
  }, [apiKey, local]);
>>>>>>> origin/main

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setStatus("loading");
    setError(null);

    try {
      const list = await fetchOpenRouterModels(apiKey);
      if (ac.signal.aborted) return;
      setModels(list.length ? list : local);
      setStatus("ready");
    } catch (e: any) {
      if (ac.signal.aborted) return;
      setError(String(e?.message ?? e ?? "Unbekannter Fehler"));
      setModels(local);
      setStatus("error");
    } finally {
      if (!abortRef.current || abortRef.current === ac) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, [apiKey, local]);

  // Lokale Modelle spiegeln, wenn sich 'local' ändert
  React.useEffect(() => {
    setModels(local);
    setStatus(local.length ? "ready" : "idle");
  }, [local]);

  // Remote laden, wenn apiKey vorhanden/ändert
  React.useEffect(() => {
    if (!apiKey) return;
    void load();
    return () => abortRef.current?.abort();
  }, [apiKey, load]);

  const reload = React.useCallback(() => { void load(); }, [load]);

  return { models, loading, error, status, reload, refresh: reload };
}

export async function fetchModelsOnce(apiKey?: string | null): Promise<OpenRouterModel[]> {
  if (!apiKey) return [];
  return await fetchOpenRouterModels(apiKey);
}
