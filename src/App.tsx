/**
 * Was & Warum:
 * App.tsx ist jetzt nur noch Orchestrierung: PersonaProvider kapselt das Laden/Validieren.
 * Der sichtbare Aufbau (ClientProvider -> AppShell -> ChatPanel) bleibt unverändert.
 */
import React from "react";
import ChatPanel from "./features/chat/ChatPanel";
import { AppShell } from "./widgets/shell/AppShell";
import { ClientProvider } from "./lib/client";
import { PersonaProvider } from "./entities/PersonaProvider";

export default function App() {
  return (
    <PersonaProvider>
      <ClientProvider>
        <AppShell>
          <ChatPanel />
        </AppShell>
      </ClientProvider>
    </PersonaProvider>
  );
}
