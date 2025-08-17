import React, { createContext, useState } from "react";
import SettingsSheet from "../../features/settings/SettingsSheet";

export const SettingsContext = createContext<() => void>(() => {});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSettings = () => setOpen(true);

  return (
    <SettingsContext.Provider value={openSettings}>
      <div className="app-root bg-[#0b0b0b] text-white min-h-dvh">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-black/30 border-b border-white/10">
          <div className="h-12 px-3 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide">
              AI Chat
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#D97706]/20 text-[#D97706]">mobil</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn--ghost" onClick={openSettings} aria-label="Einstellungen">⚙️</button>
            </div>
          </div>
        </header>
        <main className="pb-20">{children}</main>
        <SettingsSheet open={open} onOpenChange={setOpen} />
      </div>
    </SettingsContext.Provider>
  );
}

export default AppShell;
