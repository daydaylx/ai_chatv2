import * as React from "react";

type ClientCtx = { apiKey: string | null; setApiKey: (k: string | null) => void; };
const LS_KEY = "openrouter.apiKey";

export const ClientContext = React.createContext<ClientCtx>({ apiKey: null, setApiKey: () => {} });

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = React.useState<string | null>(null);

  React.useEffect(() => {
    try { const v = localStorage.getItem(LS_KEY); if (v) setApiKeyState(v); } catch {}
  }, []);

  const setApiKey = (k: string | null) => {
    setApiKeyState(k);
    try { if (!k) localStorage.removeItem(LS_KEY); else localStorage.setItem(LS_KEY, k); } catch {}
  };

  const ctx = React.useMemo<ClientCtx>(() => ({ apiKey, setApiKey }), [apiKey]);
  return <ClientContext.Provider value={ctx}>{children}</ClientContext.Provider>;
}

export function useClient() { return React.useContext(ClientContext); }
