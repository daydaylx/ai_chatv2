import { PRESETS, type PersonaPreset } from "../../lib/presets";

type Props = {
  visible: boolean;
  currentId: PersonaPreset["id"];
  onPick: (id: PersonaPreset["id"]) => void;
  onClose: () => void;
};

export default function PersonaPicker({ visible, currentId, onPick, onClose }: Props) {
  if (!visible) return null;
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__panel">
        <div className="sheet__header">
          <strong>Stil wählen</strong>
          <button className="btn" onClick={onClose} aria-label="Schließen">Schließen</button>
        </div>

        <div className="sheet__body list">
          {PRESETS.map(p => {
            const active = p.id === currentId;
            return (
              <button
                key={p.id}
                className="list__item"
                onClick={() => { onPick(p.id); onClose(); }}
                aria-pressed={active}
              >
                <div className="list__title">
                  {p.label} {active && <span style={{opacity:.7, fontWeight:400}}>(aktiv)</span>}
                </div>
                <div className="list__sub">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
