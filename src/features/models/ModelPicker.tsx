import { useEffect, useMemo, useState } from "react";
import { OpenRouterClient } from "../../lib/openrouter";
import { 
  filterModelsForPreset, 
  isFreeModel, 
  isFastModel, 
  isLargeContextModel, 
  isCodeModel, 
  isUncensoredModel,
  getCensorshipLevel,
  getModelLabel,
  categorizeModel,
  type ModelInfo
} from "../../lib/modelFilter";
import type { PersonaPreset } from "../../lib/presets";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (modelId: string) => void;
  client: OpenRouterClient;
  currentPreset?: PersonaPreset; // NEU: für intelligente Filterung
};

interface FilterState {
  free: boolean;
  fast: boolean;
  largeContext: boolean;
  code: boolean;
  uncensored: boolean;
}

const TTL_MS = 5 * 60_000; // 5 Minuten Cache
const CACHE_KEY = "ormodels:v3";

export default function ModelPicker({ visible, onClose, onPick, client, currentPreset }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FilterState>({ 
    free: false, 
    fast: false, 
    largeContext: false, 
    code: false, 
    uncensored: false 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Models laden mit Cache
  useEffect(() => {
    if (!visible) return;
    
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cache prüfen
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const obj = JSON.parse(cached);
            if (Date.now() - obj.timestamp < TTL_MS && Array.isArray(obj.data)) {
              if (!cancelled) {
                setModels(obj.data);
                setLoading(false);
                return;
              }
            }
          } catch {
            // Cache invalid, fetch new
          }
        }
        
        // Fresh fetch
        const list = await client.listModels();
        if (!cancelled) {
          setModels(list || []);
          
          // Cache speichern
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ 
              timestamp: Date.now(), 
              data: list 
            }));
          } catch (e) {
            console.warn("Failed to cache models:", e);
          }
        }
        
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load models';
          setError(message);
          console.error("Model loading failed:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [visible, client]);

  // Intelligente Filterung
  const filtered = useMemo(() => {
    if (loading || error) return [];
    
    return filterModelsForPreset(models, currentPreset, {
      text: q,
      onlyFree: filters.free ? isFreeModel : undefined,
      onlyFast: filters.fast ? isFastModel : undefined,
      onlyLargeContext: filters.largeContext ? isLargeContextModel : undefined,
      onlyCode: filters.code ? isCodeModel : undefined,
      onlyUncensored: filters.uncensored ? isUncensoredModel : undefined,
    }).slice(0, 200); // Limit für Performance
  }, [models, currentPreset, q, filters, loading, error]);

  // Filter-Handler
  const toggleFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset-Handler
  const resetFilters = () => {
    setFilters({ free: false, fast: false, largeContext: false, code: false, uncensored: false });
    setQ("");
  };

  // Preset-kompatible Modelle highlighten
  const isPresetCompatible = (modelId: string): boolean => {
    if (!currentPreset) return true;
    if (currentPreset.compatibleModels.includes("*")) return true;
    return currentPreset.compatibleModels.includes(modelId);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <h2>🤖 Modell wählen</h2>
          <button onClick={onClose} aria-label="Schließen">×</button>
        </div>

        {/* Preset-Filter Info */}
        {currentPreset && currentPreset.compatibleModels[0] !== "*" && (
          <div className="preset-filter-info">
            <div className="filter-info-header">
              📌 Gefiltert für: <strong>{currentPreset.label}</strong>
            </div>
            <div className="filter-info-details">
              Zeigt nur {currentPreset.compatibleModels.length} kompatible Modelle.
              {currentPreset.autoModel && (
                <span className="recommended-model">
                  Empfohlen: <strong>{currentPreset.autoModel.split('/')[1]}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Modell suchen..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="search-input"
          />
          {(q || Object.values(filters).some(Boolean)) && (
            <button onClick={resetFilters} className="reset-btn" title="Filter zurücksetzen">
              🔄
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="filter-section">
          <div className="filter-row">
            {[
              { key: 'free' as const, label: 'Kostenlos', icon: '💳' },
              { key: 'fast' as const, label: 'Schnell', icon: '⚡' },
              { key: 'largeContext' as const, label: 'Großer Kontext', icon: '📄' },
            ].map(filter => (
              <label key={filter.key} className={`filter-checkbox ${filters[filter.key] ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={filters[filter.key]}
                  onChange={() => toggleFilter(filter.key)}
                />
                <span className="filter-label">
                  {filter.icon} {filter.label}
                </span>
              </label>
            ))}
          </div>
          <div className="filter-row">
            {[
              { key: 'code' as const, label: 'Code', icon: '💻' },
              { key: 'uncensored' as const, label: 'Unzensiert', icon: '🔓' },
            ].map(filter => (
              <label key={filter.key} className={`filter-checkbox ${filters[filter.key] ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={filters[filter.key]}
                  onChange={() => toggleFilter(filter.key)}
                />
                <span className="filter-label">
                  {filter.icon} {filter.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="results-info">
          {loading && <span>🔄 Lade Modelle...</span>}
          {error && <span className="error">❌ Fehler: {error}</span>}
          {!loading && !error && (
            <span>
              📊 {filtered.length} {filtered.length === 1 ? 'Modell' : 'Modelle'} gefunden
              {models.length > 0 && ` (von ${models.length} gesamt)`}
            </span>
          )}
        </div>

        {/* Model List */}
        <div className="model-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <div>Lade Modelle...</div>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <div className="error-message">{error}</div>
              <button onClick={() => window.location.reload()} className="retry-btn">
                Erneut versuchen
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-message">
                Keine Modelle gefunden.
                {Object.values(filters).some(Boolean) && (
                  <div>
                    <button onClick={resetFilters} className="reset-link">
                      Filter zurücksetzen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            filtered.map((model) => {
              const modelId = String(model?.id ?? "");
              const categories = categorizeModel(model);
              const censorshipLevel = getCensorshipLevel(model);
              const isCompatible = isPresetCompatible(modelId);
              const isRecommended = currentPreset?.autoModel === modelId;
              
              return (
                <button
                  key={modelId}
                  className={`model-item ${!isCompatible ? 'incompatible' : ''} ${isRecommended ? 'recommended' : ''}`}
                  onClick={() => onPick(modelId)}
                  title={`${getModelLabel(model)} - Zensur: ${censorshipLevel}`}
                >
                  <div className="model-main">
                    <div className="model-name">
                      {isRecommended && <span className="recommended-badge">⭐</span>}
                      {getModelLabel(model)}
                      {!isCompatible && <span className="incompatible-badge">⚠️</span>}
                    </div>
                    
                    {categories.length > 0 && (
                      <div className="model-categories">
                        {categories.map(cat => (
                          <span key={cat} className={`model-category ${cat}`}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="model-meta">
                    <span className={`censorship-level level-${censorshipLevel}`}>
                      {censorshipLevel}
                    </span>
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
