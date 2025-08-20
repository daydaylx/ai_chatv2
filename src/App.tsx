import * as React from "react";
import { AppShell } from "./widgets/shell/AppShell";
import ChatPanel from "./features/chat/ChatPanel";

export default function App() {
  return (
    <AppShell>
      <ChatPanel />
    </AppShell>
  );
}
