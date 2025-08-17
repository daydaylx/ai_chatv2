import React, { useContext, useEffect, useMemo, useState } from "react";
import ModelPicker from "../../features/models/ModelPicker";
import StylePicker from "../../features/styles/StylePicker";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { PersonaContext } from "../../entities/persona";
import { useSettings } from "../../entities/settings/store";
import { isModelAllowedForStyle, pickFirstAllowedModel } from "../../lib/personaUtils";

type TabKey = "models" | "styles" | "settings";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("models");
  const s = useSettings() as any;
  const { data } = useContext(PersonaContext);

  const activeModel = s?.modelId || null;
  const activeStyle = useMemo(() => data.styles.find(st => st.id === (s?.styleId || "neutral")) || null, [data.styles, s?.styleId]);

  // Guard: wenn aktuelles Modell vom Stil blockiert ist, korrigieren
  useEffect(() => {
    if (!activeModel) return;
    if (!isModelAllowedForStyle(activeModel, activeStyle)) {
      const next = pickFirstAllowedModel(data.models, activeStyle);
      s.setModelId(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStyle?.id]);

  const activeModelLabel = useMemo(() => {
    const found = data.models.find(m => m.id === activeModel);
    return found?.label || (activeModel || "kein Modell");
  }, [data.models, activeModel]);

  return (
    <div className="h-full w-full">
      <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="h-12 flex items-center justify-between px-3">
          <button
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15"
            onClick={() => { setTab("models"); setOpen(true); }}
            aria-label="Menü"
          >☰</button>
          <div className="text-sm font-medium opacity-90">ai_chatv2</div>
          <div className="text-[11px] px-2 py-1 rounded-lg bg-[var(--accent)] text-black" title={activeModel || ""}>
            {activeModelLabel}
          </div>
        </div>
      </header>

      <main className="h-[calc(100%-3rem)]">
        {children}
      </main>

      {/* Drawer / Bottom Sheet */}
      {open && (
        <div className="fixed inset-0 z-20">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 bg-neutral-900 border-t border-white/10 rounded-t-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 pt-3">
              <button className={"px-3 py-2 rounded-lg " + (tab === "models" ? "bg-[var(--accent)] text-black" : "bg-white/10")} onClick={() => setTab("models")}>Modelle</button>
              <button className={"px-3 py-2 rounded-lg " + (tab === "styles" ? "bg-[var(--accent)] text-black" : "bg-white/10")} onClick={() => setTab("styles")}>Stile</button>
              <button className={"px-3 py-2 rounded-lg " + (tab === "settings" ? "bg-[var(--accent)] text-black" : "bg-white/10")} onClick={() => setTab("settings")}>Einstellungen</button>
              <div className="flex-1" />
              <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15" onClick={() => setOpen(false)}>Fertig</button>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              {tab === "models" && <ModelPicker />}
              {tab === "styles" && <StylePicker />}
              {tab === "settings" && <SettingsSheet />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
