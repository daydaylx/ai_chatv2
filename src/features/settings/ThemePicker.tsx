import { THEMES, type ThemeId } from "../../lib/theme";

type Props = {
  visible: boolean;
  currentId: ThemeId;
  onPick: (id: ThemeId) => void;
  onClose: () => void;
};

export default function ThemePicker({ visible, currentId, onPick, onClose }: Props) {
  if (!visible) return null;
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__panel">
        <div className="sheet__header">
          <strong>Theme</strong>
          <button className="btn" onClick={onClose} aria-label="Schließen">Schließen</button>
        </div>
        <div className="sheet__body list">
          {THEMES.map(t => {
            const active = t.id === currentId;
            return (
              <button
                key={t.id}
                className="list__item"
                onClick={() => { onPick(t.id); onClose(); }}
                aria-pressed={active}
              >
                <div className="list__title">
                  {t.label} {active && <span style={{opacity:.7, fontWeight:400}}>(aktiv)</span>}
                </div>
                <div className="list__sub" style={{display:"flex", gap:8}}>
                  <span style={{width:14, height:14, borderRadius:999, background:"var(--accent)"}} />
                  <span style={{width:14, height:14, borderRadius:999, background:"var(--accent-2)"}} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
