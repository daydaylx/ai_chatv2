import React from "react";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { registerSW, applySWUpdate } from "../../registerSW";

export const SettingsContext = React.createContext<() => void>(() => {});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [updateReg, setUpdateReg] = React.useState<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    registerSW();
    const onUpdate = (e: any) => setUpdateReg(e.detail as ServiceWorkerRegistration);
    window.addEventListener("sw:update", onUpdate);
    return () => window.removeEventListener("sw:update", onUpdate);
  }, []);

  return (
    <SettingsContext.Provider value={() => setOpen(true)}>
      <div className="min-h-[100dvh] bg-black text-white">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10">
          <div className="h-12 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">AI Chat <span className="text-xs ml-1 rounded-md px-1 py-0.5 bg-[#D97706]/20 text-[#F59E0B] align-middle">mobil</span></span>
            </div>
            <button aria-label="Einstellungen" className="w-9 h-9 rounded-xl border border-white/10 hover:bg-white/5" onClick={() => setOpen(true)}>⚙️</button>
          </div>
        </header>

        <main>{children}</main>

        <SettingsSheet open={open} onOpenChange={setOpen} />

        {updateReg && (
          <div className="fixed bottom-3 inset-x-3 z-50 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md p-3 flex items-center justify-between">
            <div className="text-sm">Update verfügbar</div>
            <div className="flex gap-2">
              <button className="btn btn--ghost" onClick={() => setUpdateReg(null)}>Später</button>
              <button className="btn btn--solid" onClick={() => applySWUpdate(updateReg!)}>Neu starten</button>
            </div>
          </div>
        )}
      </div>
    </SettingsContext.Provider>
  );
}
