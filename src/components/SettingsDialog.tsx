import React, { useEffect, useState } from "react";
import { ModelInfo, StyleTemplate } from "../types";

interface Props {
  open: boolean;
  initialApiKey?: string;
  initialModelId?: string;
  initialStyleId?: string;
  onClose: () => void;
  onSave: (opts: { apiKey: string; modelId: string; styleId: string }) => void;
}

export default function SettingsDialog({
  open,
  initialApiKey = "",
  initialModelId = "",
  initialStyleId = "neutral",
  onClose,
  onSave,
}: Props) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [modelId, setModelId] = useState(initialModelId);
  const [styleId, setStyleId] = useState(initialStyleId);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setApiKey(initialApiKey);
    setModelId(initialModelId);
    setStyleId(initialStyleId);
    (async () => {
      try {
        const m = await fetch("/models.json").then(r => r.json());
        const s = await fetch("/styles.json").then(r => r.json());
        setModels(m);
        setStyles(s);
        if (!initialModelId && m?.length) setModelId(m[0].id);
        if (!initialStyleId && s?.length) setStyleId(s[0].id);
      } catch (e) {
        setError("Konnte Modelle/Styles nicht laden (public/*.json prüfen).");
      }
    })();
  }, [open]);

  const save = () => {
    if (!modelId) {
      setError("Bitte ein Modell wählen.");
      return;
    }
    onSave({ apiKey: apiKey.trim(), modelId, styleId });
  };

  return (
    <div className={`modal ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="settings-title">Einstellungen</h2>
          <button className="icon-button" aria-label="Schließen" onClick={onClose}>
            <svg viewBox="0 0 24 24" className="icon">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert error">{error}</div>}

          <label className="field">
            <span className="field-label">OpenRouter API-Key (optional)</span>
            <input
              className="input"
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
            <small className="help">Wird lokal gespeichert (localStorage), verlässt nie den Browser.</small>
          </label>

          <label className="field">
            <span className="field-label">Modell</span>
            <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.provider ? ` · ${m.provider}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Stil-Template</span>
            <select className="input" value={styleId} onChange={(e) => setStyleId(e.target.value)}>
              {styles.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn primary" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
