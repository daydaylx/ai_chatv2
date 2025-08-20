import * as React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { initAccent } from "../../shared/lib/theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { initAccent("violet"); }, []);
  return (
    <div className="min-h-[100svh] bg-[hsl(var(--surface-0))] text-[hsl(var(--white))]">
      <Header onOpenSettings={() => setOpen(true)} />
      <main className="mx-auto max-w-screen-sm p-3">{children}</main>
      <SettingsSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}
