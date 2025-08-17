import React, { useMemo } from "react";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext, type PersonaModel } from "../../entities/persona";
import { OpenRouterClient, type OpenRouterModel } from "../../lib/openrouter";

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
type Row = { m: PersonaModel; allowed: boolean; available: boolean; remote?: OpenRouterModel|null };

export default function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data } = React.useContext(PersonaContext);
  const s = useSettings();

  const client = React.useMemo(() => new OpenRouterClient(), []);
  const [remote, setRemote] = React.useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = React.useState(false);
  const apiKeySet = !!client.getApiKey();

  React.useEffect(() => {
    let alive = true;
    if (!apiKeySet) { setRemote([]); return; }
    setLoading(true);
    client.listModels().then(list => { if (alive) setRemote(Array.isArray(list)? list: []); }).finally(()=>{ if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [client, apiKeySet]);

  const currentStyle = useMemo(() => data.styles.find(st => st.id === s.personaId) ?? data.styles[0] ?? null, [s.personaId, data.styles]);
  const remoteSet = useMemo(() => new Set(remote.map(r => r.id)), [remote]);

  // Immer konsistente Struktur zurückgeben (Row[])
  const filteredModels: Row[] = useMemo(() => {
    return data.models.map((m) => {
      const allowed = isAllowed(m.id, currentStyle?.allow, currentStyle?.deny);
      const available = remoteSet.size === 0 ? true : remoteSet.has(m.id); // ohne Key blocken wir NICHT
      return { m, allowed, available, remote: remote.find(r => r.id === m.id) || null };
    });
  }, [data.models, currentStyle, remote, remoteSet]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />
      <div className={`absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-2xl p-4 shadow-2xl transition-transform ${open ? "translate-y-0" : "translate-y-full"}`} role="dialog" aria-modal="true">
        <div className="h-1 w-12 bg-white/20 rounded-full mx-auto mb-3" />
        <div className="text-sm font-semibold mb-3">Einstellungen</div>

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
            <div className="text-xs uppercase text-white/60 mb-2">Modell {loading && <span className="text-white/40">(prüfe Verfügbarkeit…)</span>}</div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {filteredModels.map(({ m, allowed, available, remote }) => {
                const active = s.modelId === m.id;
                const disabled = !allowed || (apiKeySet && !available);
                const ctxInfo = m.context || remote?.context_length;
                return (
                  <button
                    key={m.id}
                    disabled={disabled}
                    className={`w-full px-3 py-2 rounded-xl border text-left ${active ? "border-[#D97706] bg-[#D97706]/10" : "border-white/10 hover:bg-white/5"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !disabled && s.setModelId(m.id)}
                    title={!allowed ? "Für den aktuellen Stil nicht erlaubt" : (apiKeySet ? (available ? "gelistet" : "nicht gelistet (dein Key)") : "Verfügbarkeit unbekannt (kein API-Key)")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-xs text-white/60">{m.id}{ctxInfo ? ` · ctx ${ctxInfo}` : ""}</div>
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded-full border border-white/10">
                        {!apiKeySet ? "unbekannt" : (available ? "gelistet" : "nicht gelistet")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="text-xs uppercase text-white/60 mb-2">API-Key</div>
            <ApiKeyField />
          </section>

          <div className="flex justify-end gap-2">
            <button className="btn btn--ghost" onClick={() => onOpenChange(false)}>Schließen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyField() {
  const [val, setVal] = React.useState<string>("");
  React.useEffect(() => {
    try { setVal(localStorage.getItem("openrouter_api_key") ?? ""); } catch {}
  }, []);
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
        onClick={() => { try { localStorage.setItem("openrouter_api_key", val); } catch {} }}
      >Speichern</button>
    </div>
  );
}
