import React, { useEffect, useMemo, useState } from "react";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { PersonaContext, type PersonaModel } from "../../entities/persona";
import { useSettings } from "../../entities/settings/store";

/**
 * Modell-Picker (optional separat nutzbar).
 * - Zeigt persona.json-Modelle
 * - Markiert Modelle als "verfügbar" falls in OpenRouter /models vorhanden
 * - Respektiert Stil-allow/deny via PersonaContext
 */
function matches(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i").test(text);
}
function isAllowed(modelId: string, allow?: string[], deny?: string[]): boolean {
  if (allow && allow.length) return allow.some(p => matches(modelId, p));
  if (deny && deny.length) return !deny.some(p => matches(modelId, p));
  return true;
}

type Row = {
  persona: PersonaModel;
  available: boolean;
  allowed: boolean;
  remote?: OpenRouterModel | null;
};

export default function ModelPicker() {
  const { data } = React.useContext(PersonaContext);
  const s = useSettings();
  const client = useMemo(() => new OpenRouterClient(), []);
  const [remote, setRemote] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    client.listModels()
      .then((list) => { if (alive) setRemote(Array.isArray(list) ? list : []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [client]);

  const currentStyle = useMemo(
    () => data.styles.find(st => st.id === s.personaId) ?? data.styles[0] ?? null,
    [data.styles, s.personaId]
  );

  const remoteSet = useMemo(() => new Set(remote.map(m => m.id)), [remote]);

  const rows: Row[] = useMemo(() => {
    return data.models.map(pm => ({
      persona: pm,
      available: remoteSet.has(pm.id),
      allowed: isAllowed(pm.id, currentStyle?.allow, currentStyle?.deny),
      remote: remote.find(r => r.id === pm.id) || null
    }));
  }, [data.models, remote, remoteSet, currentStyle]);

  return (
    <div className="space-y-2">
      {loading && <div className="text-xs text-white/50">Lade Modellliste…</div>}
      {rows.map(({ persona, available, allowed, remote }) => {
        const active = s.modelId === persona.id;
        const ctxInfo = persona.context || remote?.context_length;
        return (
          <button
            key={persona.id}
            disabled={!allowed}
            className={`w-full px-3 py-2 rounded-xl border text-left ${active ? "border-[#D97706] bg-[#D97706]/10" : "border-white/10 hover:bg-white/5"} ${!allowed ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => allowed && s.setModelId(persona.id)}
            title={!allowed ? "Für den aktuellen Stil nicht erlaubt" : (available ? "Verfügbar" : "Unbekannt/Nicht gelistet")}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{persona.label}</div>
                <div className="text-xs text-white/60">{persona.id}{ctxInfo ? ` · ctx ${ctxInfo}` : ""}</div>
              </div>
              <div className="text-xs px-2 py-0.5 rounded-full border border-white/10">
                {available ? "gelistet" : "unbekannt"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
