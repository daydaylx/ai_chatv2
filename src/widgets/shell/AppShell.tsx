import * as React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import SessionDrawer from "../../components/SessionDrawer";
import { initAccent } from "../../shared/lib/theme";
import "../../shared/styles/glass.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openSessions, setOpenSessions] = React.useState(false);

  React.useEffect(() => { initAccent("violet"); }, []);

  return (
    <div className="relative min-h-[100svh] text-[hsl(var(--white))]">
      {/* Hintergrund-Layer (radiale Gradients + Noise) */}
      <div className="glass-bg" aria-hidden />
      <div className="glass-noise" aria-hidden />

      {/* Inhalt */}
      <Header onOpenSettings={() => setOpenSettings(true)} onOpenSessions={() => setOpenSessions(true)} />
      <main className="relative z-10 mx-auto max-w-screen-sm p-3">
        {children}
      </main>

      {/* Sheets / Drawer */}
      <SettingsSheet open={openSettings} onOpenChange={setOpenSettings} className="glass-sheet" />
      <SessionDrawer open={openSessions} onOpenChange={setOpenSessions} className="glass-sheet" />
    </div>
  );
}
