import * as React from "react";
import { AppShell } from "./widgets/shell/AppShell";
import ChatPanel from "./features/chat/ChatPanel";
import { ClientProvider } from "./lib/client";
import { PersonaProvider } from "./entities/PersonaProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <PersonaProvider>
      <ClientProvider>
        <AppShell>
          <ErrorBoundary>
            <ChatPanel />
          </ErrorBoundary>
        </AppShell>
      </ClientProvider>
    </PersonaProvider>
  );
}
