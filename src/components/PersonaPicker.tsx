import React from 'react';
import { Preset } from '../types';

interface PersonaPickerProps {
  presets: Preset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const PersonaPicker: React.FC<PersonaPickerProps> = ({
  presets,
  selectedId,
  onSelect,
  onClose
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>Antwort-Stil wählen</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="persona-grid">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`persona-card ${selectedId === preset.id ? 'selected' : ''}`}
              onClick={() => onSelect(preset.id)}
            >
              <div className="persona-header">
                <span className="persona-emoji">{preset.emoji}</span>
                <div className="persona-info">
                  <h3>{preset.name}</h3>
                  <span className="persona-level">{preset.contentLevel}</span>
                </div>
                {selectedId === preset.id && (
                  <div className="selected-indicator">✓</div>
                )}
              </div>
              
              <p className="persona-description">{preset.description}</p>
              
              <div className="persona-preview">
                <strong>System-Prompt:</strong>
                <p className="system-preview">
                  {preset.system.substring(0, 120)}...
                </p>
              </div>
              
              <div className="persona-tags">
                <span className="tag">Temp: {preset.temperature || 0.7}</span>
                <span className="tag">Max: {preset.maxTokens || 4000}</span>
                {preset.features.map(feature => (
                  <span key={feature} className="tag feature">{feature}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="sheet-footer">
          <p className="hint">
            💡 Der gewählte Stil beeinflusst alle Antworten. 
            Bei Stil-Wechsel wird empfohlen, die Chat-Historie zu löschen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonaPicker;
