import { useContext, useEffect, useMemo, useState } from "react";
import { useSettings } from "../../entities/settings/store";
import { OpenRouterClient } from "../../lib/openrouter";
import { PersonaContext } from "../../entities/persona";

type Props = { open: boolean; onClose: () => void };

export default function SettingsSheet({ open, onClose }: Props) {
  const { modelId, setModelId, personaId, setPersonaId } = useSettings();
  const client = useMemo(() => new OpenRouterClient(), []);
  const [key, setKey] = useState<string>(() => client.getApiKey() ?? "");
  const personaCtx = useContext(PersonaContext);
  const personaData = personaCtx?.data;

  const [tab, setTab] = useState<"models"|"styles"|"settings">("models");
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());

  function saveKey() { client.setApiKey((key || "").trim()); }
  function clearKey() { client.clearApiKey(); setKey(""); }

  useEffect(() => {
    if (open && tab === "models" && availableIds.size === 0 && !loadingModels) {
      setLoadingModels(true);
      setModelError(null);
      client.listModels().then(list => {
        setAvailableIds(new Set(list.map(m => m.id)));
      }).catch(e => {
        setModelError(e?.message ?? String(e));
      }).finally(() => {
        setLoadingModels(false);
      });
    }
  }, [open, tab]);

  function globToRegExp(glob: string): RegExp {
    const esc = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
    return new RegExp("^" + esc + "$", "i");
  }
  function isModelAllowed(mid: string): boolean {
    const style = personaData?.styles.find(s => s.id === personaId);
    if (!style) return true;
    const id = mid.trim();
    if (!id) return false;
    if (style.allow) return style.allow.some(g => globToRegExp(g).test(id));
    if (style.deny) return !style.deny.some(g => globToRegExp(g).test(id));
    return true;
  }

  return (
    <div className={`sheet ${open ? "sheet--open" : ""}`} role="dialog" aria-modal="true" aria-label="Einstellungen">
      <div className="sheet__panel">
        <div className="sheet__header">
          <div className="sheet__title">Einstellungen</div>
          <button className="m-icon-btn" aria-label="Schließen" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="sheet__tabs">
          <button onClick={() => setTab("models")} className={tab==="models"?"tab-active":""}>Modelle</button>
          <button onClick={() => setTab("styles")} className={tab==="styles"?"tab-active":""}>Stile</button>
          <button onClick={() => setTab("settings")} className={tab==="settings"?"tab-active":""}>Allgemein</button>
        </div>

        <div className="sheet__content">
          {tab === "models" && (
            <section className="block">
              <h3 className="block__title">Modell</h3>
              <div className="field">
                <select className="input" value={modelId || ""} onChange={e => setModelId(e.target.value || null)}>
                  <option value="">— Modell wählen —</option>
                  {personaData?.models.map(m => {
                    const allowed = isModelAllowed(m.id);
                    const available = availableIds.size ? availableIds.has(m.id) : true;
                    return (
                      <option key={m.id} value={m.id} disabled={!allowed || !available}>
                        {m.label}{!available ? " (nicht verfügbar)" : (!allowed ? " (inkompatibel)" : "")}
                      </option>
                    );
                  })}
                </select>
                {loadingModels && <div className="hint">Lade verfügbare Modelle…</div>}
                {modelError && <div className="hint">Fehler: {modelError}</div>}
                {modelId && !isModelAllowed(modelId) && (
                  <div className="hint">Aktuelles Modell ist mit dem gewählten Stil nicht kompatibel.</div>
                )}
              </div>
            </section>
          )}

          {tab === "styles" && (
            <section className="block">
              <h3 className="block__title">Antwort-Stil</h3>
              <ul style={{display:"grid", gap:"10px", listStyle:"none", padding:0, margin:0}}>
                {personaData?.styles.map(style => (
                  <li key={style.id} className={`preset ${style.id === personaId ? "preset--active" : ""}`} style={{border:"1px solid rgba(255,255,255,.18)", borderRadius:"12px", padding:"10px"}}>
                    <label className="preset__row" style={{display:"flex", gap:"10px", alignItems:"start"}}>
                      <input type="radio" name="preset" value={style.id} checked={style.id === personaId} onChange={() => setPersonaId(style.id || null)} />
                      <div className="preset__body">
                        <div className="preset__name" style={{fontWeight:700}}>{style.name}</div>
                        <div className="preset__desc" style={{opacity:.8,fontSize:"14px"}}>{style.hint || ""}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "settings" && (
            <section className="block">
              <h3 className="block__title">API-Key</h3>
              <div className="field">
                <input type="password" className="input" placeholder="sk-..." value={key} onChange={e => setKey(e.target.value)} autoComplete="off" />
                <div className="row" style={{ marginTop: "8px", display:"flex", gap:"8px" }}>
                  <button className="btn" onClick={saveKey} disabled={!key.trim()}>Speichern</button>
                  <button className="btn btn--ghost" onClick={clearKey}>Löschen</button>
                </div>
              </div>
            </section>
          )}

          {personaCtx?.warnings.map((msg, idx) => (
            <div key={idx} className="notice">{msg}</div>
          ))}
          {personaCtx?.error && (
            <div className="notice">
              {personaCtx.error} <button className="btn btn--ghost" onClick={personaCtx.reload}>Erneut versuchen</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
