import * as React from "react";

type ClientCtx = { apiKey: string | null; setApiKey: (k: string | null) => void; };
const ClientContext = React.createContext<ClientCtx | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = React.useState<string | null>(() => localStorage.getItem("openrouter_api_key"));
  const onSet = (k: string | null) => {
    setApiKey(k);
    if (k) localStorage.setItem("openrouter_api_key", k);
    else localStorage.removeItem("openrouter_api_key");
  };
  const v = React.useMemo(() => ({ apiKey, setApiKey: onSet }), [apiKey]);
  return <ClientContext.Provider value={v}>{children}</ClientContext.Provider>;
}

export function useClient() {
  const ctx = React.useContext(ClientContext);
  if (!ctx) throw new Error("useClient outside ClientProvider");
  return ctx;
}
