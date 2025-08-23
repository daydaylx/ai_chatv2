import * as React from "react";

type ClientCtx = { apiKey: string | null; setApiKey: (k: string | null) => void; };
const ClientContext = React.createContext<ClientCtx | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
<<<<<<< HEAD
  const [apiKey, setApiKeyState] = React.useState<string | null>(null);

  React.useEffect(() => {
    try { const v = localStorage.getItem(LS_KEY); if (v) setApiKeyState(v); } catch { void 0; }
  }, []);

  const setApiKey = (k: string | null) => {
    setApiKeyState(k);
    try { if (!k) localStorage.removeItem(LS_KEY); else localStorage.setItem(LS_KEY, k); } catch { void 0; }
=======
  const [apiKey, setApiKey] = React.useState<string | null>(() => localStorage.getItem("openrouter_api_key"));
  const onSet = (k: string | null) => {
    setApiKey(k);
    if (k) localStorage.setItem("openrouter_api_key", k);
    else localStorage.removeItem("openrouter_api_key");
>>>>>>> origin/main
  };
  const v = React.useMemo(() => ({ apiKey, setApiKey: onSet }), [apiKey]);
  return <ClientContext.Provider value={v}>{children}</ClientContext.Provider>;
}

export function useClient() {
  const ctx = React.useContext(ClientContext);
  if (!ctx) throw new Error("useClient outside ClientProvider");
  return ctx;
}
