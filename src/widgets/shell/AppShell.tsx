import React from "react";
import Header from "../../components/Header";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { ToastProvider } from "../../shared/ui/Toast";
import { initAccent } from "../../shared/lib/theme";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { useClient } from "../../lib/client";
import { useModelCatalog } from "../../lib/catalog";
import { chooseDefaultModel } from "../../config/defaults";

export type SettingsOpenTab = "root" | "model" | "style" | "onboarding";
export const SettingsContext = React.createContext<(tab?: SettingsOpenTab)=>void>(()=>{});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<SettingsOpenTab>("root");

  // Theme init
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

  // === Default-Modell festlegen, falls noch keines gewählt ===
  const settings = useSettings();
  const persona = React.useContext(PersonaContext);
  const { apiKey } = useClient();
  const catalog = useModelCatalog({ local: persona.data.models, apiKey });

  React.useEffect(() => {
    if (settings.modelId) return;                    // Nutzer hat schon eins gewählt
    if (catalog.status !== "ready") return;          // warte auf Katalog
    const id = chooseDefaultModel(catalog.models as any);
    if (id) settings.setModelId(id);
  }, [settings.modelId, catalog.status, catalog.models, settings]);

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
