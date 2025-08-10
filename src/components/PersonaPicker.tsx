import React from "react";
import { PRESETS, type PersonaPreset } from "../lib/presets";
import type { ThemeId } from "../lib/theme";
import { getRecommendedModelForPreset } from "../lib/autoSetup";

type Props = {
  visible: boolean;
  currentId?: string;
  currentModel?: string;
  currentTheme?: ThemeId;
  onPick?: (id: PersonaPreset["id"]) => void;     // legacy
  onChange?: (id: PersonaPreset["id"]) => void;   // preferred
  onAutoSetup: (preset: PersonaPreset) => void;
  onClose: () => void;
};

function LevelBadge({ level }: { level: PersonaPreset["contentLevel"] }) {
  const map = {
    safe: { cls: "safe", text: "Sicher", icon: "✅" },
    mature: { cls: "mature", text: "Reif", icon: "⚠️" },
    adult: { cls: "adult", text: "Erwachsene", icon: "🔞" },
    unlimited: { cls: "unlimited", text: "Unbegrenzt", icon: "🔓" },
  } as const;
  const s = map[level];
  return <div className={`content-level ${s.cls}`}>{s.icon} {s.text}</div>;
}

export default function PersonaPicker({
  visible, currentId, currentModel, currentTheme, onPick, onChange, onAutoSetup, onClose
}: Props) {
  if (!visible) return null;
  const [cat, setCat] = React.useState<"all"|"safe"|"mature"|"adult"|"unlimited">("all");
  const presets = cat === "all" ? PRESETS : PRESETS.filter(p => p.contentLevel === cat);
  const emit = (id: PersonaPreset["id"]) => (onChange ?? onPick)?.(id);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎭 Stil wählen</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="category-filter">
          {(["all","safe","mature","adult","unlimited"] as const).map(id => {
            const label = id === "all" ? "Alle" :
              id === "safe" ? "Sicher" :
              id === "mature" ? "Reif" :
              id === "adult" ? "Erwachsene" : "Unbegrenzt";
            const count = id === "all" ? PRESETS.length : PRESETS.filter(p => p.contentLevel === id).length;
            return (
              <button key={id} className={`category-btn ${cat===id?'active':''}`} onClick={() => setCat(id)}>
                {label} ({count})
              </button>
            );
          })}
        </div>

        <div className="preset-list">
          {presets.map(p => {
            const active = p.id === currentId;
            const rec = getRecommendedModelForPreset(p);
            return (
              <div key={p.id} className={`preset-item ${active ? "active" : ""}`}>
                <div className="preset-main" onClick={() => emit(p.id)}>
                  <div className="preset-header">
                    <div className="preset-label">{p.label}</div>
                    {(p.autoModel || p.autoTheme) && <div className="preset-auto-indicator">🎯 Auto</div>}
                  </div>
                  <div className="preset-desc">{p.desc}</div>
                  <div className="preset-meta">
                    <LevelBadge level={p.contentLevel} />
                    {p.tags?.slice(0,2).map(t => <span key={t} className="preset-tag">#{t}</span>)}
                  </div>
                  {(p.autoModel || p.autoTheme) && (
                    <div className="auto-preview">
                      <div className="auto-preview-items">
                        {rec && <span className="auto-preview-item">📱 {rec.split('/')[1] || rec}</span>}
                        {p.autoTheme && <span className="auto-preview-item">🎨 {p.autoTheme}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {(p.autoModel || p.autoTheme) && (
                  <button
                    className="auto-setup-btn"
                    onClick={(e) => { e.stopPropagation(); onAutoSetup(p); }}
                    title="Auto-Setup: Modell + Theme passend setzen"
                  >🎯 Auto</button>
                )}
              </div>
            );
          })}
          {presets.length === 0 && <div className="empty-state">Keine Presets gefunden.</div>}
        </div>

        {currentId && (
          <div className="current-setup-info">
            <h3>🔧 Aktuelle Konfiguration</h3>
            <div className="config-grid">
              <div className="config-item"><span className="config-label">Stil:</span><span className="config-value">{PRESETS.find(p=>p.id===currentId)?.label}</span></div>
              {currentModel && <div className="config-item"><span className="config-label">Modell:</span><span className="config-value">{currentModel.split('/')[1]||currentModel}</span></div>}
              {currentTheme && <div className="config-item"><span className="config-label">Theme:</span><span className="config-value">{currentTheme}</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
