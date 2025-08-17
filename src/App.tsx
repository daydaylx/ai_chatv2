import React, { useEffect, useState } from "react";
import { PersonaContext, type PersonaData } from "./entities/persona";
import { loadPersonaData } from "./api";
import AppShell from "./widgets/shell/AppShell";
import ChatPanel from "./features/chat/ChatPanel";
import "./index.css";

export default function App() {
  const [persona, setPersona] = useState<PersonaData>({ models: [], styles: [] });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void reload(); }, []);

  async function reload() {
    try {
      const res = await loadPersonaData();
      setPersona(res.data);
      setWarnings(res.warnings);
      setError(null);
    } catch {
      setPersona({ models: [], styles: [{ id:"neutral", name:"Sachlich", system:"Kurz, präzise, Deutsch." }] });
      setWarnings(["Konfiguration nicht geladen – Standardwerte aktiv."]);
      setError("Konfiguration nicht geladen.");
    }
  }

  return (
    <PersonaContext.Provider value={{ data: persona, warnings, error, reload }}>
      <div className="h-screen w-screen bg-black text-white"
        style={{
          ["--accent" as any]: "#D97706",
          ["--ring" as any]: "rgba(217,119,6,0.6)",
          ["--bubble-user" as any]: "rgba(217,119,6,0.18)",
          ["--bubble-ai" as any]: "rgba(255,255,255,0.06)"
        }}
      >
        <AppShell>
          <ChatPanel />
        </AppShell>
      </div>
    </PersonaContext.Provider>
  );
}
