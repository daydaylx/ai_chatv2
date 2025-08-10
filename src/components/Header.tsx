type Props = {
  title?: string;
  keySet: boolean;
  modelLabel?: string;
  onOpenSettings: () => void;
};

export default function Header({ title = "AI Chat", keySet, modelLabel, onOpenSettings }: Props) {
  return (
    <header className="m-header">
      <div className="m-header__title" title={title}>
        {title}
      </div>
      <div className="m-header__right">
        {modelLabel ? (
          <span className="m-chip" title={`Modell: ${modelLabel}`}>
            <span className="m-dot m-dot--ok" />
            <span className="m-chip__text">{modelLabel}</span>
          </span>
        ) : (
          <span className="m-chip" title="Kein Modell gewählt">
            <span className="m-dot m-dot--warn" />
            <span className="m-chip__text">Modell</span>
          </span>
        )}

        <button className="m-icon-btn" aria-label="Einstellungen öffnen" onClick={onOpenSettings}>
          {/* simple gear icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm8.2-3.2a6.9 6.9 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7.9 7.9 0 0 0-1.7-1l-.3-2.5H10.2l-.3 2.5c-.6.2-1.1.5-1.7 1l-2.3-1-2 3.5 2 1.5a6.9 6.9 0 0 0-.1 1c0 .3 0 .7.1 1l-2 1.5 2 3.5 2.3-1c.5.4 1.1.7 1.7 1l.3 2.5h3.5l.3-2.5c.6-.2 1.1-.5 1.7-1l2.3 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" fill="currentColor"/>
          </svg>
        </button>

        <span className="m-chip" title={keySet ? "API-Key vorhanden" : "Kein API-Key"}>
          <span className={`m-dot ${keySet ? "m-dot--ok" : "m-dot--warn"}`} />
          <span className="m-chip__text">Key</span>
        </span>
      </div>
    </header>
  );
}
