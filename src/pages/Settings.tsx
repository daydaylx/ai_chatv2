import React from "react";
import type { ThemeMode } from "@/types";
import { applyTheme } from "@/lib/theme";
import { loadTheme, saveTheme } from "@/lib/storage";

export default function Settings() {
  const [mode, setMode] = React.useState<ThemeMode>(() => loadTheme());
  const [density, setDensity] = React.useState<"compact" | "comfortable">("comfortable");

  React.useEffect(() => {
    applyTheme(mode);
    saveTheme(mode);
  }, [mode]);

  React.useEffect(() => {
    const root = document.documentElement;
    if (density === "compact") root.classList.add("compact");
    else root.classList.remove("compact");
  }, [density]);

  return (
    <div className="container py-6 space-y-6">
      <div className="panel p-5 space-y-4">
        <h2 className="text-xl font-semibold">Einstellungen</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Theme</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ThemeMode)}
              className="input w-full mt-1"
            >
              <option value="system">System</option>
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
            </select>
            <p className="muted text-sm mt-1">Passt Farben automatisch an System oder feste Auswahl an.</p>
          </div>

          <div>
            <label className="text-sm font-medium">Dichte</label>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value as any)}
              className="input w-full mt-1"
            >
              <option value="comfortable">Komfortabel</option>
              <option value="compact">Kompakt</option>
            </select>
            <p className="muted text-sm mt-1">Kompakt reduziert Abstände für mehr Informationsdichte.</p>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="section-title">Info</h3>
        <ul className="list-disc pl-5 muted">
          <li>Alle Stile werden lokal im Browser gespeichert (LocalStorage).</li>
          <li>Export/Import ermöglicht Übertragung zwischen Geräten.</li>
          <li>Kein Service Worker – keine Offline-Funktion, bewusst für Stabilität.</li>
        </ul>
      </div>
    </div>
  );
}
