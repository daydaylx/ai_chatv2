import React from "react";
import { PRESETS, type PersonaPreset } from "../lib/presets";
import { getSetupInfo } from "../lib/autoSetup";
import type { ThemeId } from "../lib/theme";

interface PersonaPickerProps {
  visible: boolean;
  currentId?: string;
  currentModel?: string;
  currentTheme?: ThemeId;
  onPick: (id: PersonaPreset["id"]) => void;
  onAutoSetup: (preset: PersonaPreset) => void;
  onClose: () => void;
}

interface ContentLevelInfo {
  color: string;
  label: string;
  icon: string;
}

function getContentLevelInfo(level: PersonaPreset["contentLevel"]): ContentLevelInfo {
  switch (level) {
    case "safe": 
      return { color: "safe", label: "Sicher", icon: "✅" };
    case "mature": 
      return { color: "mature", label: "Reif", icon: "⚠️" };
    case "adult": 
      return { color: "adult", label: "Erwachsene", icon: "🔞" };
    case "unlimited": 
      return { color: "unlimited", label: "Unbegrenzt", icon: "🔓" };
    default: 
      return { color: "safe", label: "Sicher", icon: "✅" };
  }
}

function PresetItem({ 
  preset, 
  isActive, 
  onPick, 
  onAutoSetup 
}: {
  preset: PersonaPreset;
  isActive: boolean;
  onPick: () => void;
  onAutoSetup: () => void;
}) {
  const setupInfo = getSetupInfo(preset);
  const levelInfo = getContentLevelInfo(preset.contentLevel);
  
  return (
    <div className={`preset-item ${isActive ? "active" : ""}`}>
      {/* Main Preset Content */}
      <div className="preset-main" onClick={onPick}>
        <div className="preset-header">
          <div className="preset-label">{preset.label}</div>
          {setupInfo.hasAutoSetup && (
            <div className="preset-auto-indicator">
              🎯 Auto
            </div>
          )}
        </div>
        
        <div className="preset-desc">{preset.desc}</div>
        
        <div className="preset-meta">
          {/* Content Level Badge */}
          <div className={`content-level ${levelInfo.color}`}>
            {levelInfo.icon} {levelInfo.label}
          </div>
          
          {/* Tags */}
          {preset.tags && preset.tags.length > 0 && (
            <div className="preset-tags">
              {preset.tags.slice(0, 2).map(tag => (
                <span key={tag} className="preset-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Auto-Setup Preview */}
        {setupInfo.hasAutoSetup && (
          <div className="auto-preview">
            <div className="auto-preview-items">
              {setupInfo.modelName && (
                <span className="auto-preview-item">
                  📱 {setupInfo.modelName}
                </span>
              )}
              {preset.autoTheme && (
                <span className="auto-preview-item">
                  🎨 {preset.autoTheme}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Auto-Setup Button */}
      {setupInfo.hasAutoSetup && (
        <button
          className="auto-setup-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAutoSetup();
          }}
          title={`Auto-Setup: ${setupInfo.description}`}
          aria-label={`Automatische Konfiguration für ${preset.label}`}
        >
          🎯 Auto
        </button>
      )}
    </div>
  );
}

function CompatibilityWarning({ 
  preset, 
  currentModel 
}: { 
  preset: PersonaPreset; 
  currentModel?: string; 
}) {
  if (!currentModel || 
      preset.compatibleModels.includes("*") || 
      preset.compatibleModels.includes(currentModel)) {
    return null;
  }
  
  const recommendedModels = preset.compatibleModels
    .slice(0, 2)
    .map(m => m.split('/')[1] || m);
  
  return (
    <div className="compatibility-warning">
      <div className="warning-header">
        ⚠️ <strong>Modell-Inkompatibilität</strong>
      </div>
      <div className="warning-content">
        Das aktuelle Modell <strong>{currentModel.split('/')[1] || currentModel}</strong> ist 
        nicht optimal für "{preset.label}".
      </div>
      <div className="warning-suggestion">
        <strong>Empfohlen:</strong> {recommendedModels.join(', ')}
      </div>
    </div>
  );
}

export default function PersonaPicker({
  visible, 
  currentId, 
  currentModel, 
  currentTheme, 
  onPick, 
  onAutoSetup, 
  onClose,
}: PersonaPickerProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  
  if (!visible) return null;

  const currentPreset = PRESETS.find(p => p.id === currentId);
  
  // Kategorien für Filterung
  const categories = [
    { id: "all", label: "Alle", count: PRESETS.length },
    { id: "safe", label: "Sicher", count: PRESETS.filter(p => p.contentLevel === "safe").length },
    { id: "mature", label: "Reif", count: PRESETS.filter(p => p.contentLevel === "mature").length },
    { id: "adult", label: "Erwachsene", count: PRESETS.filter(p => p.contentLevel === "adult").length },
    { id: "unlimited", label: "Unbegrenzt", count: PRESETS.filter(p => p.contentLevel === "unlimited").length },
  ].filter(cat => cat.count > 0);
  
  const filteredPresets = selectedCategory === "all" 
    ? PRESETS 
    : PRESETS.filter(p => p.contentLevel === selectedCategory);
  
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <h2>🎭 Stil wählen</h2>
          <button 
            aria-label="Schließen" 
            onClick={onClose}
            className="modal-close-btn"
          >
            ×
          </button>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* Preset List */}
        <div className="preset-list">
          {filteredPresets.map(preset => (
            <PresetItem
              key={preset.id}
              preset={preset}
              isActive={preset.id === currentId}
              onPick={() => onPick(preset.id)}
              onAutoSetup={() => onAutoSetup(preset)}
            />
          ))}
          
          {filteredPresets.length === 0 && (
            <div className="empty-state">
              Keine Presets in dieser Kategorie gefunden.
            </div>
          )}
        </div>

        {/* Current Configuration Info */}
        {currentPreset && (
          <div className="current-setup-info">
            <h3>🔧 Aktuelle Konfiguration</h3>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">Stil:</span>
                <span className="config-value">{currentPreset.label}</span>
              </div>
              {currentModel && (
                <div className="config-item">
                  <span className="config-label">Modell:</span>
                  <span className="config-value">{currentModel.split('/')[1] || currentModel}</span>
                </div>
              )}
              {currentTheme && (
                <div className="config-item">
                  <span className="config-label">Theme:</span>
                  <span className="config-value">{currentTheme}</span>
                </div>
              )}
            </div>
            
            {/* Compatibility Warning */}
            <CompatibilityWarning 
              preset={currentPreset} 
              currentModel={currentModel} 
            />
          </div>
        )}

        {/* Quick Info */}
        <div className="quick-info">
          <div className="info-item">
            💡 <strong>Tipp:</strong> Der <strong>🎯 Auto</strong>-Button konfiguriert 
            Modell und Theme automatisch optimal für den gewählten Stil.
          </div>
          <div className="info-item">
            🔓 <strong>Hinweis:</strong> Uncensored Presets erfordern kompatible Modelle 
            für beste Ergebnisse.
          </div>
        </div>
        
      </div>
    </div>
  );
}
