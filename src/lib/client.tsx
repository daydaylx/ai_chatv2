import React, { createContext, useState } from "react";
import { OpenRouterClient, SendOptions } from "./openrouter";

interface ClientCtx {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  client: { send: (o: Omit<SendOptions, "apiKey">) => Promise<string> };
}

export const ClientContext = createContext<ClientCtx | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setKey] = useState<string | null>(null);
  const client = new OpenRouterClient(apiKey ? { apiKey } : { apiKey: "" });

  return (
    <ClientContext.Provider
      value={{
        apiKey,
        setApiKey: setKey,
        client: {
          send: async (o: Omit<SendOptions, "apiKey">) => {
            return await client.send(o); // ✅ string zurückgeben
          },
        },
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const ctx = React.useContext(ClientContext);
  if (!ctx) throw new Error("ClientContext not found");
  return ctx;
}
