import React, { useMemo, useState, useEffect } from "react";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext, type PersonaModel } from "../../entities/persona";
import { useClient } from "../../lib/client";
import type { OpenRouterModel } from "../../lib/openrouter";

/** simples Glob-Matching für allow/deny */
function matches(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i").test(text);
}
function isAllowed(modelId: string, allow?: string[], deny?: string[]): boolean {
  if (allow && allow.length) return allow.some(p => matches(modelId, p));
  if (deny && deny.length) return !deny.some(p => matches(modelId, p));
  return true;
}

type Row = { m: PersonaModel; allowed: boolean; available: boolean; remote?: OpenRouterModel | null };

export default function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data } = React.useContext(PersonaContext);
  const s = useSettings();
  const { client, apiKey, refreshModels, remoteIds, remoteLoaded } = useClient();
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open && apiKey && !remoteLoaded) setLoading(true); else setLoading(false); }, [open, apiKey, remoteLoaded]);

  const currentStyle = useMemo(
    () => data.styles.find(st => st.id === s.personaId) ?? data.styles[0] ?? null,
    [s.personaId, data.styles]
  );

  const rows: Row[] = useMemo(() => {
    return data.models.map((m) => {
      const allowed = isAllowed(m.id, currentStyle?.allow, currentStyle?.deny);
      const available = remoteIds.size === 0 ? true : remoteIds.has(m.id);
      return { m, allowed, available, remote: undefined };
    });
  }, [data.models, currentStyle, remoteIds]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />
      <div className={`absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-2xl p-4 shadow-2xl transition-transform ${open ? "translate-y-0" : "translate-y-full"}`} role="dialog" aria-modal="true">
        <div className="h-1 w-12 bg-white/20 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Einstellungen</div>
          <button
            className="text-xs px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5"
            onClick={() => { setLoading(true); void refreshModels().finally(()=>setLoading(false)); }}
            title="Modelle neu prüfen"
          >{loading ? "aktualisiere…" : "Modelle neu prüfen"}</button>
        </div>

        <div className="space-y-6">
          <section>
            <div className="text-xs uppercase text-white/60 mb-2">Stil</div>
            <div className="grid grid-cols-2 gap-2">
              {data.styles.map(st => (
                <button
                  key={st.id}
                  className={`px-3 py-2 rounded-xl border text-left ${s.personaId === st.id ? "border-[#D97706] bg-[#D97706]/10" : "border-white/10 hover:bg-white/5"}`}
                  onClick={() => s.setPersonaId(st.id)}
                >
                  <div className="text-sm font-medium">{st.name}</div>
                  {st.hint && <div className="text-xs text-white/60">{st.hint}</div>}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs uppercase text-white/60 mb-2">Modell {(!remoteLoaded && apiKey) && <span className="text-white/40">(prüfe Verfügbarkeit…)</span>}</div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {rows.map(({ m, allowed, available }) => {
                const active = s.modelId === m.id;
                const disabled = !allowed || (apiKey && !available);
                return (
                  <button
                    key={m.id}
                    disabled={disabled}
                    className={`w-full px-3 py-2 rounded-xl border text-left ${active ? "border-[#D97706] bg-[#D97706]/10" : "border-white/10 hover:bg-white/5"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !disabled && s.setModelId(m.id)}
                    title={!allowed ? "Für den aktuellen Stil nicht erlaubt" : (apiKey ? (available ? "gelistet" : "nicht gelistet (dein Key)") : "Verfügbarkeit unbekannt (kein API-Key)")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-xs text-white/60">{m.id}{m.context ? ` · ctx ${m.context}` : ""}</div>
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded-full border border-white/10">
                        {!apiKey ? "unbekannt" : (available ? "gelistet" : "nicht gelistet")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="text-xs uppercase text-white/60 mb-2">API-Key</div>
            <ApiKeyField
              initial={apiKey ?? ""}
              onSave={(k) => { 
                try { localStorage.setItem("openrouter_api_key", k); } catch {}
                client.setApiKey(k);
                void refreshModels();
              }}
            />
          </section>

          <div className="flex justify-end gap-2">
            <button className="btn btn--ghost" onClick={() => onOpenChange(false)}>Schließen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyField({ initial, onSave }: { initial: string; onSave: (k: string) => void }) {
  const [val, setVal] = React.useState<string>(initial);
  useEffect(() => { setVal(initial); }, [initial]);
  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2"
        placeholder="sk-or-…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button
        className="btn btn--solid"
        onClick={() => onSave(val)}
      >Speichern</button>
    </div>
  );
}
