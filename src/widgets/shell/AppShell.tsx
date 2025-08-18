import React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";

export type SettingsOpenTab = "root" | "model" | "style" | "onboarding";
export const SettingsContext = React.createContext<(tab?: SettingsOpenTab)=>void>(()=>{});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<SettingsOpenTab>("root");

  const openSettings = React.useCallback((t?: SettingsOpenTab) => {
    setTab(t ?? "root");
    setOpen(true);
  }, []);

  return (
    <SettingsContext.Provider value={openSettings}>
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-[#0A0A0A] to-black text-white">
        <Header />
        <main className="flex-1">{children}</main>
        <SettingsSheet open={open} tab={tab} onClose={()=>setOpen(false)} />
      </div>
    </SettingsContext.Provider>
  );
}
