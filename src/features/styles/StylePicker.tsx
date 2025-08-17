import React, { useContext } from "react";
import { PersonaContext } from "../../entities/persona";
import { useSettings } from "../../entities/settings/store";
import { pickFirstAllowedModel } from "../../lib/personaUtils";

export default function StylePicker() {
  const { data } = useContext(PersonaContext);
  const s = useSettings() as any;

  const active = s?.styleId || "neutral";

  function applyStyle(id: string) {
    s.setStyleId(id);
    // Nach Stilwechsel ggf. Modell korrigieren:
    const style = data.styles.find(st => st.id === id) || null;
    const currentModel = s?.modelId || null;
    // Wenn kein Modell gesetzt oder disallowed -> passendes wählen
    if (!currentModel) {
      const first = pickFirstAllowedModel(data.models, style);
      s.setModelId(first);
    } else {
      const ok = style ? (style.allow || style.deny) ? true : true : true; // Prüfung konkret später im Picker
      // keine harte Aktion hier; Picker selbst disabled Disallowed-Modelle
    }
  }

  return (
    <div className="p-3 text-sm text-white">
      <div className="opacity-80 mb-2">Stile</div>
      <div className="flex flex-col gap-2">
        {data.styles.map(st => {
          const isActive = active === st.id;
          return (
            <button
              key={st.id}
              onClick={() => applyStyle(st.id)}
              className={"text-left rounded-xl px-3 py-2 border " +
                (isActive ? "border-[var(--accent)] bg-[color:rgb(217_119_6_/_0.10)]" : "border-white/10 bg-white/5 hover:bg-white/10")}
            >
              <div className="font-medium">{st.name}</div>
              {st.hint && <div className="text-xs opacity-70">{st.hint}</div>}
              {(st.allow || st.deny) && (
                <div className="text-[10px] mt-1 opacity-70">
                  {st.allow?.length ? `allow: ${st.allow.join(", ")}` : ""}
                  {st.deny?.length ? ` deny: ${st.deny.join(", ")}` : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
