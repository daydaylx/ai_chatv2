import * as React from "react";
import { OpenRouterClient, type OpenRouterModel } from "./openrouter";

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

export function useModelCatalog(opts?: UseCatalogOpts): CatalogState {
  // Stabilisiere 'local', damit es nicht bei jeder Objekt-Identität die Hooks triggert
  const local = React.useMemo<OpenRouterModel[]>(
    () => opts?.local ?? [],
    // JSON.stringify trick stabilisiert einfache Arrays/Objekte ohne tiefe Vergleiche
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(opts?.local ?? [])]
  );
  const apiKey = (opts?.apiKey ?? "") || "";

  const [models, setModels] = React.useState<OpenRouterModel[]>(local);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<CatalogStatus>(local.length ? "ready" : "idle");

  const abortRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(async () => {
    if (!apiKey) {
      setModels(local);
      setError(null);
      setLoading(false);
      setStatus(local.length ? "ready" : "idle");
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setStatus("loading");
    setError(null);

    try {
      const client = new OpenRouterClient({ apiKey });
      const list = await client.listModels();
      if (ac.signal.aborted) return;

      const arr = Array.isArray(list) ? list : [];
      setModels(arr.length ? arr : local);
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

  React.useEffect(() => {
    if (local.length) {
      setModels(local);
      if (status === "idle") setStatus("ready");
    }
    if (apiKey) void load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, local]);

  const reload = React.useCallback(() => { void load(); }, [load]);

  return {
    models,
    loading,
    error,
    status,
    reload,
    refresh: reload,
  };
}

export async function fetchModelsOnce(apiKey?: string | null): Promise<OpenRouterModel[]> {
  if (!apiKey) return [];
  const client = new OpenRouterClient({ apiKey });
  return await client.listModels();
}
