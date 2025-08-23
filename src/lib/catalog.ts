/* eslint-env browser */
import * as React from "react";

const AC = globalThis.AbortController;
type ACType = InstanceType<typeof AC>;

export type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
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

async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  if (!apiKey) return [];
  const r = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": location.origin,
      "X-Title": "Disa AI",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`OpenRouter: ${r.status} ${r.statusText}`);
  const j = await r.json();
  const raw = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);

  return raw.map((m: any) => ({
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
    free: !!m?.free,
    allow_nsfw: !!m?.allow_nsfw,
    fast: !!m?.fast,
    tags: Array.isArray(m?.tags) ? m.tags.filter((t: any) => typeof t === "string") : undefined,
  })).filter((m: OpenRouterModel) => !!m.id);
}

export function useModelCatalog(opts?: UseCatalogOpts): CatalogState {
  const localInput = opts?.local;
  const local = React.useMemo<OpenRouterModel[]>(() => localInput ?? [], [localInput]);

  const apiKeyIn = opts?.apiKey ?? null;
  const apiKey = React.useMemo<string>(() => (apiKeyIn ?? "") || "", [apiKeyIn]);

  const [models, setModels] = React.useState<OpenRouterModel[]>(local);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<CatalogStatus>(local.length ? "ready" : "idle");

  const abortRef = React.useRef<ACType | null>(null);

  const load = React.useCallback(async () => {
    if (!apiKey) {
      setModels(local);
      setError(null);
      setLoading(false);
      setStatus(local.length ? "ready" : "idle");
      return;
    }

    // vorherigen Lauf abbrechen
    abortRef.current?.abort();
    const ac = new AC();
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

  // Wenn lokale Models sich ändern, UI sofort updaten
  React.useEffect(() => {
    setModels(local);
    setStatus(local.length ? "ready" : "idle");
  }, [local]);

  // Wenn apiKey vorhanden/ändert, remote laden
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
