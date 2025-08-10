import { useEffect, useMemo, useState } from "react";
import type { PersonaPreset } from "../../lib/presets";
import { 
  filterModelsForPreset,
  isFreeModel, isFastModel, isLargeContextModel, isCodeModel,
  isUncensoredModel, getCensorshipLevel, getModelLabel, categorizeModel,
  type ModelInfo
} from "../../lib/modelFilter";
import { OpenRouterClient, type OpenRouterModel } from "../../lib/openrouter";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick?: (modelId: string) => void;   // legacy
  onChange?: (modelId: string) => void; // preferred
  client: OpenRouterClient;
  currentPreset?: PersonaPreset;
};

interface FilterState { free: boolean; fast: boolean; largeContext: boolean; code: boolean; uncensored: boolean; }

const TTL_MS = 5 * 60_000;
const CACHE_KEY = "ormodels:v4";

export default function ModelPicker({ visible, onClose, onPick, onChange, client, currentPreset }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FilterState>({ free:false, fast:false, largeContext:false, code:false, uncensored:false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const emit = (id: string) => (onChange ?? onPick)?.(id);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const obj = JSON.parse(cached);
            if (Date.now() - obj.timestamp < TTL_MS && Array.isArray(obj.data)) {
              if (!cancelled) { setModels(obj.data); setLoading(false); return; }
            }
          } catch {}
        }
        const list = await client.listModels();
        if (!cancelled) {
          setModels(list || []);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: list })); } catch {}
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Fehler beim Laden der Modelle");
          console.error("Model loading failed:", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible, client]);

  const filtered = useMemo(() => {
    if (loading || error) return [];
    return filterModelsForPreset(models as unknown as ModelInfo[], currentPreset, {
      text: q,
      onlyFree: filters.free ? isFreeModel : undefined,
      onlyFast: filters.fast ? isFastModel : undefined,
      onlyLargeContext: filters.largeContext ? isLargeContextModel : undefined,
      onlyCode: filters.code ? isCodeModel : undefined,
      onlyUncensored: filters.uncensored ? isUncensoredModel : undefined,
    }).slice(0, 200) as unknown as OpenRouterModel[];
  }, [models, currentPreset, q, filters, loading, error]);

  const toggle = (k: keyof FilterState) => setFilters(s => ({ ...s, [k]: !s[k] }));
  const reset = () => { setFilters({ free:false, fast:false, largeContext:false, code:false, uncensored:false }); setQ(""); };

  const presetAllows = (modelId: string) =>
    !currentPreset || currentPreset.compatibleModels.includes("*") || currentPreset.compatibleModels.includes(modelId);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 Modell wählen</h2>
          <button onClick={onClose} aria-label="Schließen">×</button>
        </div>

        {currentPreset && currentPreset.compatibleModels[0] !== "*" && (
          <div className="preset-filter-info">
            <div className="filter-info-header">📌 Gefiltert für: <strong>{currentPreset.label}</strong></div>
            <div className="filter-info-details">
              Zeigt nur {currentPreset.compatibleModels.length} kompatible Modelle.
              {currentPreset.autoModel && <span className="recommended-model">Empfohlen: <strong>{currentPreset.autoModel.split('/')[1]}</strong></span>}
            </div>
          </div>
        )}

        <div className="search-section">
          <input className="search-input" placeholder="Modell suchen..." value={q} onChange={e=>setQ(e.target.value)} />
          {(q || Object.values(filters).some(Boolean)) && <button className="reset-btn" onClick={reset} title="Filter zurücksetzen">🔄</button>}
        </div>

        <div className="filter-section">
          <div className="filter-row">
            {[
              { k:'free' as const, label:'Kostenlos', icon:'💳' },
              { k:'fast' as const, label:'Schnell', icon:'⚡' },
              { k:'largeContext' as const, label:'Großer Kontext', icon:'📄' },
            ].map(f => (
              <label key={f.k} className={`filter-checkbox ${filters[f.k]?'checked':''}`}>
                <input type="checkbox" checked={filters[f.k]} onChange={()=>toggle(f.k)} />
                <span className="filter-label">{f.icon} {f.label}</span>
              </label>
            ))}
          </div>
          <div className="filter-row">
            {[
              { k:'code' as const, label:'Code', icon:'💻' },
              { k:'uncensored' as const, label:'Unzensiert', icon:'🔓' },
            ].map(f => (
              <label key={f.k} className={`filter-checkbox ${filters[f.k]?'checked':''}`}>
                <input type="checkbox" checked={filters[f.k]} onChange={()=>toggle(f.k)} />
                <span className="filter-label">{f.icon} {f.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="results-info">
          {loading && <span>🔄 Lade Modelle…</span>}
          {error && <span className="error">❌ Fehler: {error}</span>}
          {!loading && !error && <span>📊 {filtered.length} angezeigt {models.length>0 && `(von ${models.length})`}</span>}
        </div>

        <div className="model-list">
          {loading ? (
            <div className="loading-state"><div className="loading-spinner"></div><div>Lade Modelle…</div></div>
          ) : error ? (
            <div className="error-state"><div className="error-icon">❌</div><div className="error-message">{error}</div><button className="retry-btn" onClick={()=>window.location.reload()}>Erneut versuchen</button></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-message">Keine Modelle gefunden. {Object.values(filters).some(Boolean) && <button onClick={reset} className="reset-link">Filter zurücksetzen</button>}</div></div>
          ) : (
            filtered.map(m => {
              const id = String(m?.id ?? "");
              const cats = categorizeModel(m as any);
              const level = getCensorshipLevel(m as any);
              const ok = presetAllows(id);
              const rec = currentPreset?.autoModel === id;

              return (
                <button key={id} className={`model-item ${!ok?'incompatible':''} ${rec?'recommended':''}`} onClick={()=>emit(id)} title={`${getModelLabel(m as any)} – Zensur: ${level}`}>
                  <div className="model-main">
                    <div className="model-name">{rec && <span className="recommended-badge">⭐</span>}{getModelLabel(m as any)} {!ok && <span className="incompatible-badge">⚠️</span>}</div>
                    {!!cats.length && <div className="model-categories">{cats.map(c => <span key={c} className={`model-category ${c}`}>{c}</span>)}</div>}
                  </div>
                  <div className="model-meta">
                    <span className={`censorship-level level-${level}`}>{level}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
