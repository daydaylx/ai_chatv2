import React, { createContext, useContext, useMemo, useState } from "react";
import { OpenRouterClient, type OpenRouterModel } from "./openrouter";

/**
 * Zentraler Client + Model-Availability + Kontextlängen
 */
type ClientCtx = {
  client: OpenRouterClient;
  apiKey: string | null;
  setApiKey: (k: string) => void;

  remoteModels: OpenRouterModel[];
  remoteIds: Set<string>;
  remoteLoaded: boolean;
  refreshModels: () => Promise<void>;

  /** geschätzte Kontextlänge eines Modells (Tokens) */
  getContextFor: (modelId: string, fallback?: number) => number;
};

const Ctx = createContext<ClientCtx | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new OpenRouterClient());
  const [apiKey, setApiKeyState] = useState<string | null>(client.getApiKey());
  const [remoteModels, setRemoteModels] = useState<OpenRouterModel[]>([]);
  const [remoteIds, setRemoteIds] = useState<Set<string>>(new Set());
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  async function refreshModels() {
    setRemoteLoaded(false);
    const list = await client.listModelsCached(5 * 60 * 1000);
    setRemoteModels(list);
    setRemoteIds(new Set(list.map(m => m.id)));
    setRemoteLoaded(true);
  }

  function setApiKey(k: string) {
    client.setApiKey(k);
    setApiKeyState(k);
    void refreshModels();
  }

  React.useEffect(() => { void refreshModels(); }, []);

  function getContextFor(modelId: string, fallback = 8192): number {
    const m = remoteModels.find(x => x.id === modelId);
    return m?.context_length || fallback;
  }

  const value = useMemo<ClientCtx>(() => ({
    client, apiKey, setApiKey,
    remoteModels, remoteIds, remoteLoaded, refreshModels,
    getContextFor
  }), [client, apiKey, remoteModels, remoteIds, remoteLoaded]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClient(): ClientCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useClient must be used within ClientProvider");
  return v;
}
