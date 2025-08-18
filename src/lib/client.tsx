import React from "react";
import type { ChatMessage, SendOptions } from "./openrouter";
import { sendChat } from "./openrouter";

type ClientCtx = {
  apiKey: string | null;
  setApiKey: (k: string | null) => void;
  client: { send: (o: Omit<SendOptions, "apiKey">) => Promise<string>; };
  /** System-Prompt 1:1 aus personas.json (style.system) */
  getSystemFor: (style: { system: string } | undefined | null) => ChatMessage | null;
};

export const ClientContext = React.createContext<ClientCtx>({
  apiKey: null,
  setApiKey: () => {},
  client: { send: async () => "" },
  getSystemFor: () => null,
});

const KEY = "openrouter_api_key";

function readKey(): string | null {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return null;
    const v = window.localStorage.getItem(KEY);
    return v && v.length ? v : null;
  } catch { return null; }
}
function writeKey(v: string | null) {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    if (!v) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, v);
  } catch {}
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = React.useState<string | null>(readKey());

  const setKey = React.useCallback((k: string | null) => {
    setApiKey(k ?? null);
    writeKey(k ?? null);
  }, []);

  const getSystemFor = React.useCallback((style: { system: string } | undefined | null) => {
    if (!style) return null;
    if (import.meta.env?.DEV) {
      if (typeof style.system !== "string" || !style.system.length) {
        console.warn("[guard] style.system ist leer/fehlt");
      }
    }
    return { role: "system" as const, content: style.system };
  }, []);

  const client = React.useMemo(() => ({
    send: async (o: Omit<SendOptions, "apiKey">) => {
      if (!apiKey) throw new Error("Kein API-Key gesetzt.");
      return await sendChat({ apiKey, ...o });
    }
  }), [apiKey]);

  return (
    <ClientContext.Provider value={{ apiKey, setApiKey: setKey, client, getSystemFor }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return React.useContext(ClientContext);
}
