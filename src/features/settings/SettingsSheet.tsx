import React, { useState } from "react";
import { useSettings } from "../../entities/settings/store";
import { loadPersonaData } from "../../api";

export default function SettingsSheet() {
  const s = useSettings() as any;
  const [localKey, setLocalKey] = useState<string>(s?.apiKey || "");

  async function handleRefreshModels() {
    const res = await loadPersonaData();
    // hier nur Trigger/Toast – dein Persona-Context/App lädt beim Start; alternativ globalen Reload exposed lassen
    alert(`Modelle geprüft: ${res.data.models.length} gültig.\n${res.warnings.join("\n")}`);
  }

  return (
    <div className="p-3 text-sm text-white">
      <h2 className="text-base font-semibold mb-2">Einstellungen</h2>

      <div className="mb-3">
        <label className="block mb-1 opacity-80">OpenRouter API-Key</label>
        <input
          type="password"
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          placeholder="sk-or-..."
          value={localKey}
          onChange={e => setLocalKey(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-[var(--accent)] text-black"
            onClick={() => s.setApiKey(localKey)}
          >Speichern</button>
          <button
            className="px-3 py-2 rounded-lg bg-white/10"
            onClick={() => setLocalKey("")}
          >Leeren</button>
        </div>
      </div>

      <div className="mb-3">
        <label className="block mb-1 opacity-80">Akzentfarbe</label>
        <input
          type="color"
          className="h-9 w-16 rounded border border-white/10 bg-black/20"
          value={s?.accent || "#D97706"}
          onChange={e => s.setAccent?.(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <button
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
          onClick={() => void handleRefreshModels()}
        >Modelle neu prüfen</button>
      </div>
    </div>
  );
}
