import React from "react";
import { applyTheme } from "@/lib/theme";
import { loadTheme, saveTheme } from "@/lib/storage";
import type { ThemeMode } from "@/types";

export const ThemeSwitcher: React.FC = () => {
  const [mode, setMode] = React.useState<ThemeMode>(() => loadTheme());

  React.useEffect(() => {
    applyTheme(mode);
    saveTheme(mode);
  }, [mode]);

  return (
    <div className="inline-flex items-center gap-2">
      <label className="muted text-sm">Theme</label>
      <select
        className="input"
        value={mode}
        aria-label="Theme auswählen"
        onChange={(e) => setMode(e.target.value as ThemeMode)}
      >
        <option value="system">System</option>
        <option value="light">Hell</option>
        <option value="dark">Dunkel</option>
      </select>
    </div>
  );
};
