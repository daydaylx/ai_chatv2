import * as React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import SessionDrawer from "../../components/SessionDrawer";
import { initAccent } from "../../shared/lib/theme";
/* PAPER-Stile statt Glass: */
import "../../shared/styles/paper.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openSessions, setOpenSessions] = React.useState(false);

  React.useEffect(() => { initAccent("amber"); }, []); // warmer Standard-Akzent passt zum Paper-Theme

  return (
    <div className="relative min-h-[100svh] text-[hsl(var(--white))]">
      {/* Hintergrund-Layer (Paper-Spots + Grain) */}
      <div className="glass-bg" aria-hidden />
      <div className="glass-noise" aria-hidden />

      {/* Inhalt */}
      <Header onOpenSettings={() => setOpenSettings(true)} onOpenSessions={() => setOpenSessions(true)} />
      <main className="relative z-10 mx-auto max-w-screen-sm p-3">
        {children}
      </main>

      {/* Sheets / Drawer (bekommen ihre Optik über die paper.css-Styles) */}
      <SettingsSheet open={openSettings} onOpenChange={setOpenSettings} className="glass-sheet" />
      <SessionDrawer open={openSessions} onOpenChange={setOpenSessions} className="glass-sheet" />
    </div>
  );
}
