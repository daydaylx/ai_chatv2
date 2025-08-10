import React from "react";
import { THEMES, applyTheme, type ThemeId, type Theme } from "../../lib/theme";

type Props = {
  visible: boolean;
  value?: ThemeId;
  onChange?: (id: ThemeId) => void;
  onClose: () => void;
};

export default function ThemePicker({ visible, value, onChange, onClose }: Props) {
  if (!visible) return null;

  const items: Theme[] = Object.values(THEMES);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎨 Theme wählen</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="preset-list">
          {items.map((t: Theme) => (
            <button
              key={t.id}
              className={`model-item ${value === t.id ? "recommended" : ""}`}
              onClick={() => { applyTheme(t.id); onChange?.(t.id); onClose(); }}
            >
              <div className="model-main">
                <div className="model-name">{t.name}</div>
                <div className="model-categories">
                  <span className="model-category">{t.id}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
