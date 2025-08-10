import { useEffect, useState } from "react";
import { getPersistedKey, setPersistedKey } from "@/lib/storage";
import ModelPicker from "./ModelPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  model: string | null;
  setModel: (m: string) => void;
};

export default function Settings({ open, onClose, apiKey, setApiKey, model, setModel }: Props) {
  const [persist, setPersist] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);

  useEffect(() => {
    const k = getPersistedKey();
    if (k) {
      setPersist(true);
      if (!apiKey) {
        setLocalKey(k);
        setApiKey(k);
      }
    }
  }, []);

  const save = () => {
    setApiKey(localKey.trim());
    if (persist) setPersistedKey(localKey.trim());
    else setPersistedKey(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 12
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 600, background: "#12121a",
          border: "1px solid #1d1d28", borderRadius: 14, padding: 12
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Einstellungen</div>

        <div style={{ display: "grid", gap: 10 }}>
          <label className="small">OpenRouter API-Key</label>
          <input
            type="password"
            inputMode="text"
            placeholder="sk-or-v1-…"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            style={{
              height: 44, borderRadius: 10, border: "1px solid #2a2a38",
              background: "#181822", color: "white", padding: "0 10px", fontSize: 14
            }}
          />

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
            />
            <span className="small">API-Key lokal speichern (nur wenn du dem Gerät vertraust)</span>
          </label>

          <div style={{ marginTop: 2 }}>
            <ModelPicker apiKey={localKey} value={model} onChange={setModel} disabled={!localKey} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
