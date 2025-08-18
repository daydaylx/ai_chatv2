import React from "react";
import { Sheet } from "../../shared/ui/Sheet";
import Button from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import { Switch } from "../../shared/ui/Switch";
import { Badge } from "../../shared/ui/Badge";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext, PersonaStyle } from "../../entities/persona";
import { useClient } from "../../lib/client";
import { filterModels, sortModels, Filter } from "../../lib/modelMeta";
import { Spinner } from "../../shared/ui/Spinner";
import { OpenRouterClient } from "../../lib/openrouter";

type Tab = "root" | "model" | "style" | "onboarding";
type Props = { open: boolean; tab: Tab; onClose: () => void; };

export default function SettingsSheet({ open, tab, onClose }: Props) {
  const [active, setActive] = React.useState<Tab>(tab);
  React.useEffect(() => setActive(tab), [tab]);

  const { data, warnings, error } = React.useContext(PersonaContext);
  const settings = useSettings();
  const { apiKey, setApiKey } = useClient();

  // API-Key Status
  const [checking, setChecking] = React.useState(false);
  const [keyStatus, setKeyStatus] = React.useState<null | "ok" | "fail">(null);

  async function checkKey() {
    if (!apiKey) { setKeyStatus("fail"); return; }
    setChecking(true);
    try {
      const cli = new OpenRouterClient({ apiKey });
      await cli.listModels();
      setKeyStatus("ok");
    } catch {
      setKeyStatus("fail");
    } finally {
      setChecking(false);
    }
  }

  // Filter & Suche
  const [filter, setFilter] = React.useState<Filter>({ free: false, allow_nsfw: false, fast: false });
  const [query, setQuery] = React.useState("");
  const [initializing, setInitializing] = React.useState(true);
  React.useEffect(() => { const t = setTimeout(()=>setInitializing(false), 150); return ()=>clearTimeout(t); }, []); // mini delay, verhindert "0 Modelle" flackern

  const filteredBase = React.useMemo(() => sortModels(filterModels(data.models, filter), settings.favorites), [data.models, filter, settings.favorites]);
  const modelsView = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredBase;
    return filteredBase.filter(m => {
      const hay = [
        m.id, m.name ?? "", m.label ?? "",
        ...(m.tags ?? []), m.description ?? ""
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [filteredBase, query]);

  const onPickModel = (id: string) => {
    settings.setModelId(id);
    setActive("root");
  };
  const onPickStyle = (id: string | null) => {
    settings.setPersonaId(id);
    setActive("root");
  };

  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen" ariaLabel="Einstellungen">
      {/* Tabs */}
      <div className="flex gap-2 pb-2 flex-wrap">
        <TabButton label="Allgemein" current={active==="root"} onClick={() => setActive("root")} />
        <TabButton label="Modell" current={active==="model"} onClick={() => setActive("model")} />
        <TabButton label="Stil" current={active==="style"} onClick={() => setActive("style")} />
      </div>

      {active === "root" && (
        <div className="grid gap-4">
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold opacity-90">OpenRouter API-Key</h3>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="sk-or-v1-..."
                value={apiKey ?? ""}
                onChange={(e)=>{ setApiKey(e.target.value || null); setKeyStatus(null); }}
                aria-label="API-Key"
              />
              <Button variant="outline" onClick={checkKey} aria-label="API-Key prüfen">
                {checking ? <span className="inline-flex items-center gap-2"><Spinner size={16}/> Prüfen…</span> : "Prüfen"}
              </Button>
              <Button variant="outline" onClick={()=>{ setApiKey(null); setKeyStatus(null); }} aria-label="API-Key löschen">Löschen</Button>
            </div>
            <div className="text-xs opacity-70 flex items-center gap-2">
              <span>Wird lokal (localStorage) gespeichert.</span>
              {keyStatus === "ok" && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-green-300">✓ Key gültig</span>}
              {keyStatus === "fail" && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-red-300">✗ Key ungültig</span>}
            </div>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold opacity-90">Hinweise</h3>
            {error && <div className="text-sm text-red-400">⚠ {error}</div>}
            {warnings.map((w,i)=> <div key={i} className="text-xs opacity-80">• {w}</div>)}
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold opacity-90">Schnellzugriff</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={()=>setActive("model")} variant="outline">Modell wählen</Button>
              <Button onClick={()=>setActive("style")} variant="outline">Stil wählen</Button>
            </div>
          </section>
        </div>
      )}

      {active === "model" && (
        <div className="grid gap-3">
          {/* Suche eigene Zeile auf Mobile */}
          <div className="flex flex-col gap-2">
            <Input placeholder="Suchen (id, name, tag)…" value={query} onChange={(e)=>setQuery(e.target.value)} aria-label="Modellsuche" />
            <div className="flex items-center gap-3 flex-wrap">
              <Switch checked={!!filter.free} onCheckedChange={(v)=>setFilter(f=>({...f, free:v}))} label="Free" />
              <Switch checked={!!filter.allow_nsfw} onCheckedChange={(v)=>setFilter(f=>({...f, allow_nsfw:v}))} label="18+ erlaubt" />
              <Switch checked={!!filter.fast} onCheckedChange={(v)=>setFilter(f=>({...f, fast:v}))} label="Schnell" />
            </div>
          </div>

          <div className="grid gap-2 max-h-[55dvh] overflow-auto pr-1">
            {initializing && <div className="text-sm opacity-70 flex items-center gap-2"><Spinner/> Modelle laden…</div>}

            {!initializing && modelsView.map((m)=>(
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 hover:bg-white/5">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{m.label ?? m.name ?? m.id}</div>
                  <div className="text-xs opacity-70 truncate">{m.description ?? m.id}</div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {m.free ? <Badge>Free</Badge> : null}
                    {m.allow_nsfw ? <Badge>18+</Badge> : null}
                    {(m.context ?? m.ctx) ? <Badge>ctx {m.context ?? m.ctx}</Badge> : null}
                    {m.fast ? <Badge>Fast</Badge> : null}
                    {(m.tags ?? []).slice(0,3).map((t)=> <Badge key={t}>{t}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={()=>onPickModel(m.id)} aria-label={`Modell ${m.id} wählen`}>Wählen</Button>
                  <button
                    className="h-9 w-9 rounded-full border border-white/15 hover:bg-white/5"
                    aria-label="Favorit umschalten"
                    onClick={()=>useSettings.getState().toggleFavorite(m.id)}
                    title="Favorit"
                  >{useSettings.getState().favorites?.[m.id] ? "★" : "☆"}</button>
                </div>
              </div>
            ))}

            {!initializing && modelsView.length === 0 && (
              <div className="text-sm opacity-80 p-2">Keine Modelle gefunden. Suche/Filter anpassen.</div>
            )}
          </div>
        </div>
      )}

      {active === "style" && (
        <div className="grid gap-3 max-h-[62dvh] overflow-auto pr-1">
          {data.styles.map((s)=> <StyleCard key={s.id} s={s} currentId={useSettings.getState().personaId ?? undefined} onPick={onPickStyle} />)}
        </div>
      )}
    </Sheet>
  );
}

function TabButton({ label, current, onClick }: { label: string; current: boolean; onClick: ()=>void }) {
  return (
    <button
      onClick={onClick}
      className={"h-9 px-3 rounded-full text-sm border " + (current ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.12)]" : "border-white/15 hover:bg-white/5")}
      aria-current={current ? "page" : undefined}
    >{label}</button>
  );
}

function StyleCard({ s, onPick, currentId }: { s: PersonaStyle; onPick: (id: string|null)=>void; currentId?: string }) {
  const active = currentId === s.id;
  return (
    <button
      onClick={()=>onPick(s.id)}
      className={"w-full p-3 text-left rounded-2xl border transition " + (active ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.10)]" : "border-white/12 hover:bg-white/5")}
      aria-pressed={active}
    >
      <div className="font-medium">{s.name}</div>
      {s.description ? <div className="text-xs opacity-70 mt-0.5">{s.description}</div> : null}
      <div className="mt-2 text-[11px] opacity-60 line-clamp-3">{s.system}</div>
    </button>
  );
}
