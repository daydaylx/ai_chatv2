import React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { ToastProvider } from "../../shared/ui/Toast";
import { initAccent } from "../../shared/lib/theme";

export type SettingsOpenTab = "root" | "model" | "style" | "onboarding";
export const SettingsContext = React.createContext<(tab?: SettingsOpenTab)=>void>(()=>{});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<SettingsOpenTab>("root");

  // Apply saved accent on mount
  React.useEffect(() => { initAccent("violet"); }, []);

  const openSettings = React.useCallback((t?: SettingsOpenTab) => {
    setTab(t ?? "root");
    setOpen(true);
    if (!(history.state && (history.state as any).sheet)) {
      history.pushState({ sheet: true }, "");
    }
  }, []);

  React.useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if ((e.state as any)?.sheet) {
        setOpen(false);
        return;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const closeSettings = React.useCallback(() => {
    setOpen(false);
    if (history.state && (history.state as any).sheet) {
      history.back();
    }
  }, []);

  return (
    <ToastProvider>
      <SettingsContext.Provider value={openSettings}>
        <div className="min-h-[100dvh] flex flex-col bg-page-gradient text-1">
          <Header />
          <main className="flex-1">{children}</main>
          <SettingsSheet open={open} tab={tab} onClose={closeSettings} />
        </div>
      </SettingsContext.Provider>
    </ToastProvider>
  );
}
