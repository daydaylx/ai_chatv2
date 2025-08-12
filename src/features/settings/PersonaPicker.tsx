import { PRESETS } from "../../lib/presets";

type Props = {
  visible: boolean;
  currentId: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

export default function PersonaPicker({ visible, currentId, onPick, onClose }: Props) {
  if (!visible) return null;
  return (
    <div className="dialog" role="dialog" aria-modal="true" aria-label="Antwort-Stil wählen">
      <div className="dialog__panel">
        <div className="dialog__header">
          <div className="dialog__title">Antwort-Stil</div>
          <button className="m-icon-btn" aria-label="Schließen" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="dialog__content">
          <ul className="preset-list">
            {PRESETS.map(p => (
              <li key={p.id} className={`preset ${currentId === p.id ? "preset--active" : ""}`}>
                <label className="preset__row">
                  <input type="radio" name="preset" value={p.id} checked={currentId === p.id} onChange={() => onPick(p.id)} />
                  <div className="preset__body">
                    <div className="preset__name">{p.label}</div>
                    <div className="preset__desc">{p.description}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="dialog__footer">
          <button className="btn" onClick={onClose}>Übernehmen</button>
        </div>
      </div>
    </div>
  );
}
