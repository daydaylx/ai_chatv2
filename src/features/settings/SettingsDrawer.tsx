import { useEffect, useMemo, useRef, useState } from "react";
import { OpenRouterClient } from "../../lib/openrouter";
import { ModelPicker } from "../models/ModelPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  client: OpenRouterClient;
  modelId: string | "";
  onModelChange: (id: string) => void;
  onKeyChanged?: () => void;
  personaLabel?: string;
  onOpenPersona?: () => void;
};

export default function SettingsDrawer({ open, onClose, client, modelId, onModelChange, onKeyChanged, personaLabel, onOpenPersona }: Props) {
  const [key, setKey] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setKey(client.getApiKey());
      lastActive.current = (document.activeElement as HTMLElement) ?? null;
      setTimeout(() => panelRef.current?.focus(), 30);
      const onKeyEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", onKeyEsc);
      return () => document.removeEventListener("keydown", onKeyEsc);
    } else {
      lastActive.current?.focus?.();
    }
  }, [open, client, onClose]);

  useEffect(() => {
    function onBackdrop(e: MouseEvent) {
      if (!open) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (e.target instanceof Element && e.target.classList.contains("sheet")) onClose();
    }
    document.addEventListener("click", onBackdrop);
    return () => document.removeEventListener("click", onBackdrop);
  }, [open, onClose]);

  function saveKey() { client.setApiKey(key.trim()); onKeyChanged?.(); }
  function clearKey() { client.clearApiKey(); setKey(""); onKeyChanged?.(); }

  const modelLabel = useMemo(() => (modelId ? modelId : "Bitte wählen…"), [modelId]);

  return (
    <div className={`sheet ${open ? "sheet--open" : ""}`} role="dialog" aria-modal="true" aria-label="Einstellungen">
      <div className="sheet__panel" ref={panelRef} tabIndex={-1}>
        <div className="sheet__header">
          <div className="sheet__title">Einstellungen</div>
          <button className="m-icon-btn" aria-label="Schließen" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="sheet__content">
          <section className="block">
            <h3 className="block__title">API-Key</h3>
            <div className="field">
              <input type="password" placeholder="sk-..." className="input" value={key}
                     onChange={(e) => setKey(e.target.value)} autoComplete="off" spellCheck={false}/>
            </div>
            <div className="row">
              <button className="btn" onClick={saveKey} disabled={!key.trim()}>Speichern</button>
              <button className="btn btn--ghost" onClick={clearKey}>Löschen</button>
            </div>
          </section>

          <section className="block">
            <h3 className="block__title">Modell</h3>
            <ModelPicker value={modelId || ""} onChange={onModelChange} client={client} />
            <div className="hint">Aktuelles Modell: <code>{modelLabel}</code></div>
          </section>

          <section className="block">
            <h3 className="block__title">Antwort-Stil</h3>
            <button className="btn" onClick={onOpenPersona}>Stil wählen…</button>
            {personaLabel && <div className="hint">Aktueller Stil: <code>{personaLabel}</code></div>}
          </section>
        </div>

        <div className="sheet__safe" />
      </div>
    </div>
  );
}
