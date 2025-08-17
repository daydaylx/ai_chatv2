import React, { useMemo } from "react";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext, type PersonaModel } from "../../entities/persona";

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

type Row = { m: PersonaModel; allowed: boolean };

export default function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data } = React.useContext(PersonaContext);
  const s = useSettings();

  const currentStyle = useMemo(
    () => data.styles.find(st => st.id === s.personaId) ?? data.styles[0] ?? null,
    [s.personaId, data.styles]
  );

  // Immer konsistente Struktur zurückgeben (Row[])
  const filteredModels: Row[] = useMemo(() => {
    return data.models.map((m) => ({
      m,
      allowed: isAllowed(m.id, currentStyle?.allow, currentStyle?.deny)
    }));
  }, [data.models, currentStyle]);

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
            <div className="text-xs uppercase text-white/60 mb-2">Modell</div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {filteredModels.map(({ m, allowed }) => {
                const active = s.modelId === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!allowed}
                    className={`w-full px-3 py-2 rounded-xl border text-left ${active ? "border-[#D97706] bg-[#D97706]/10" : "border-white/10 hover:bg-white/5"} ${!allowed ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => allowed && s.setModelId(m.id)}
                    title={!allowed ? "Für den aktuellen Stil nicht erlaubt" : ""}
                  >
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-white/60">{m.id} {m.context ? `· ctx ${m.context}` : ""}</div>
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
        onChange={e => setVal(e.target.value)}
      />
      <button
        className="btn btn--solid"
        onClick={() => { try { localStorage.setItem("openrouter_api_key", val); } catch {} }}
      >Speichern</button>
    </div>
  );
}
