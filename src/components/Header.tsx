type Props = {
  title?: string;
  keySet: boolean;
  modelLabel?: string;
  onOpenSettings: () => void;
};

export default function Header({ title = "AI Chat", keySet, modelLabel, onOpenSettings }: Props) {
  return (
    <header className="m-header">
      <div className="m-header__title" title={title}>{title}</div>
      <div className="m-header__right">
        {modelLabel ? (
          <span className="badge" title={`Modell: ${modelLabel}`}>{modelLabel}</span>
        ) : (
          <span className="badge badge--warn" title="Kein Modell ausgewählt">kein Modell</span>
        )}
        <button className="m-icon-btn" onClick={onOpenSettings} aria-label="Einstellungen">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.7 1.7-1a.5.5 0 0 0 .2-.7l-1.6-2.7a.5.5 0 0 0-.7-.2l-1.7 1a7.6 7.6 0 0 0-1.6-.9l-.3-2a.5.5 0 0 0-.5-.4h-3.2a.5.5 0 0 0-.5.4l-.3 2a7.6 7.6 0 0 0-1.6.9l-1.7-1a.5.5 0 0 0-.7.2L3.7 11a.5.5 0 0 0 .2.7l1.7 1a7.2 7.2 0 0 0 0 1.8l-1.7 1a.5.5 0 0 0-.2.7l1.6 2.7c.1.2.4.3.7.2l1.7-1c.5.3 1 .6 1.6.9l.3 2c.1.2.3.4.5.4h3.2c.2 0 .4-.2.5-.4l.3-2c.6-.3 1.1-.6 1.6-.9l1.7 1c.3.1.6 0 .7-.2l1.6-2.7a.5.5 0 0 0-.2-.7l-1.7-1c.1-.6.2-1.2.2-1.8Z" fill="currentColor"/>
          </svg>
        </button>
        <span className={keySet ? "dot dot--ok" : "dot dot--bad"} title={keySet ? "API-Key gesetzt" : "Kein API-Key"} />
      </div>
    </header>
  );
}
