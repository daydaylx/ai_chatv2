import * as React from "react";
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
  const [error, setError] = React.useState<string | null>(null);

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
      setLoading(false);
    }
  }, [apiKey, local]);

  React.useEffect(() => { void load(); }, [load]);

  return { models, loading, error, refresh: load };
}
