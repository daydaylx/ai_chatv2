import * as React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import SessionDrawer from "../../components/SessionDrawer";
import { initAccent } from "../../shared/lib/theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openSessions, setOpenSessions] = React.useState(false);

  React.useEffect(() => { initAccent("violet"); }, []);

  return (
    <div className="min-h-[100svh] bg-[hsl(var(--surface-0))] text-[hsl(var(--white))]">
      <Header onOpenSettings={() => setOpenSettings(true)} onOpenSessions={() => setOpenSessions(true)} />
      <main className="mx-auto max-w-screen-sm p-3">{children}</main>
      <SettingsSheet open={openSettings} onOpenChange={setOpenSettings} />
      <SessionDrawer open={openSessions} onOpenChange={setOpenSessions} />
    </div>
  );
}
