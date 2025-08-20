import * as React from "react";
import type { OpenRouterModel } from "./openrouter";
import { listModels } from "./openrouter";

export type CatalogState = {
  models: OpenRouterModel[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type UseCatalogOpts = { local?: OpenRouterModel[]; apiKey?: string | null };

export function useModelCatalog(opts?: UseCatalogOpts): CatalogState {
  const local = React.useMemo<OpenRouterModel[]>(() => opts?.local ?? [], [JSON.stringify(opts?.local ?? [])]);
  const apiKey = opts?.apiKey ?? null;

  const [models, setModels] = React.useState<OpenRouterModel[]>(local);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!apiKey) { setModels(local); return; }
      const remote = await listModels(apiKey);
      // Merge: Remote priorisiert, lokale ergänzen falls IDs fehlen
      const ids = new Set(remote.map(m => m.id));
      const add = local.filter(m => !ids.has(m.id));
      setModels([...remote, ...add]);
    } catch (e: any) {
      setError(e?.message || String(e));
      setModels(local);
    } finally {
      setLoading(false);
    }
  }, [apiKey, JSON.stringify(local)]);

  React.useEffect(() => { void load(); }, [load]);

  return { models, loading, error, refresh: load };
}
