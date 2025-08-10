import { useEffect, useMemo, useState } from "react";
import { OpenRouterClient } from "../../lib/openrouter";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (modelId: string) => void;
  client: OpenRouterClient;
};

type ORModel = any;

function isFree(m: ORModel): boolean {
  const p = m?.pricing ?? m?.price ?? null;
  if (!p) return false;
  const nums: number[] = [];
  const collect = (obj: any) => {
    if (!obj) return;
    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      if (typeof v === "number") nums.push(v);
      else if (typeof v === "object") collect(v);
    }
  };
  collect(p);
  if (nums.length === 0) return false;
  return nums.every((n) => n === 0);
}

function isFast(m: ORModel): boolean {
  const id: string = String(m?.id ?? "");
  return /mini|flash|small|fast|lite|o4-mini/i.test(id);
}

function isLargeContext(m: ORModel): boolean {
  const ctx = Number(m?.context_length ?? m?.contextLength ?? 0);
  if (ctx >= 100_000) return true;
  const id: string = String(m?.id ?? "");
  return /(128k|200k|1\.5|long|pro)/i.test(id);
}

function isCode(m: ORModel): boolean {
  const id: string = String(m?.id ?? "");
  return /coder|code|starcoder|qwen.*coder|deepseek.*coder|replit|codellama/i.test(id);
}

function isLowModeration(m: ORModel): boolean {
  const id = String(m?.id ?? "");
  return /nous-?hermes|dolphin|panda|mythomax|wizard|uncensored/i.test(id);
}

function modelLabel(m: ORModel): string {
  return m?.name || m?.id || "unknown";
}

const TTL_MS = 5 * 60_000;
const CACHE_KEY = "ormodels:v2";

export default function ModelPicker({ visible, onClose, onPick, client }: Props) {
  const [models, setModels] = useState<ORModel[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ free: false, fast: false, large: false, code: false, lowmod: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const obj = JSON.parse(cached);
          if (Date.now() - obj.t < TTL_MS && Array.isArray(obj.data)) {
            setModels(obj.data);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      try {
        const list = await client.listModels();
        setModels(list);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: list }));
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, client]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return models.filter((m) => {
      if (f.free && !isFree(m)) return false;
      if (f.fast && !isFast(m)) return false;
      if (f.large && !isLargeContext(m)) return false;
      if (f.code && !isCode(m)) return false;
      if (f.lowmod && !isLowModeration(m)) return false;
      if (text) {
        const s = (m?.id || m?.name || "").toLowerCase();
        if (!s.includes(text)) return false;
      }
      return true;
    }).slice(0, 200);
  }, [models, q, f]);

  if (!visible) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__panel">
        <div className="sheet__header">
          <strong>Modelle</strong>
          <button className="btn" onClick={onClose} aria-label="Schließen">Schließen</button>
        </div>

        <div className="sheet__filters">
          <input
            className="input"
            placeholder="Suchen…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="chips">
            <label><input type="checkbox" checked={f.free} onChange={e => setF({ ...f, free: e.target.checked })}/> Free</label>
            <label><input type="checkbox" checked={f.fast} onChange={e => setF({ ...f, fast: e.target.checked })}/> Schnell</label>
            <label><input type="checkbox" checked={f.large} onChange={e => setF({ ...f, large: e.target.checked })}/> Großer Kontext</label>
            <label><input type="checkbox" checked={f.code} onChange={e => setF({ ...f, code: e.target.checked })}/> Code</label>
            <label><input type="checkbox" checked={f.lowmod} onChange={e => setF({ ...f, lowmod: e.target.checked })}/> Wenig Moderation</label>
          </div>
        </div>

        {loading ? (
          <div className="sheet__body">Lade Modelle…</div>
        ) : (
          <div className="sheet__body list">
            {filtered.map((m) => (
              <button key={m.id} className="list__item" onClick={() => { onPick(m.id); onClose(); }}>
                <div className="list__title">{modelLabel(m)}</div>
                <div className="list__sub">{m.id}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="muted">Keine Modelle gefunden.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
