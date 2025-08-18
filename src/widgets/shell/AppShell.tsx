import React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { ToastProvider } from "../../shared/ui/Toast";

export type SettingsOpenTab = "root" | "model" | "style" | "onboarding";
export const SettingsContext = React.createContext<(tab?: SettingsOpenTab)=>void>(()=>{});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<SettingsOpenTab>("root");

  const openSettings = React.useCallback((t?: SettingsOpenTab) => {
    setTab(t ?? "root");
    setOpen(true);
    // Hardware-Back: eigenen History-Eintrag setzen
    history.pushState({ sheet: true }, "");
  }, []);

  // Back-Button: Sheet schließen statt Seite verlassen
  React.useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if ((e.state as any)?.sheet) {
        setOpen(false);
        // den Eintrag „verbrauchen“ (kein erneutes poppen)
        return;
      }
      // nichts: normaler Back
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Wenn Sheet manuell geschlossen wird, History bereinigen (so gut es geht)
  const closeSettings = React.useCallback(() => {
    setOpen(false);
    if (history.state && (history.state as any).sheet) {
      history.back();
    }
  }, []);

  return (
    <ToastProvider>
      <SettingsContext.Provider value={openSettings}>
        <div className="min-h-[100dvh] flex flex-col bg-page-gradient text-white">
          <Header />
          <main className="flex-1">{children}</main>
          <SettingsSheet open={open} tab={tab} onClose={closeSettings} />
        </div>
      </SettingsContext.Provider>
    </ToastProvider>
  );
}
