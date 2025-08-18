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

type Tab = "root" | "model" | "style" | "onboarding";
type Props = { open: boolean; tab: Tab; onClose: () => void; };

export default function SettingsSheet({ open, tab, onClose }: Props) {
  const [active, setActive] = React.useState<Tab>(tab);
  React.useEffect(() => setActive(tab), [tab]);

  const { data, warnings, error } = React.useContext(PersonaContext);
  const settings = useSettings();
  const { apiKey, setApiKey } = useClient();

  // Filter & Suche
  const [filter, setFilter] = React.useState<Filter>({ free: false, allow_nsfw: false, fast: false });
  const [query, setQuery] = React.useState("");
  const filteredBase = React.useMemo(() => sortModels(filterModels(data.models, filter), settings.favorites), [data.models, filter, settings.favorites]);
  const modelsView = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredBase;
    return filteredBase.filter(m => {
      const hay = [
        m.id, m.name ?? "", m.label ?? "",
        ...(m.tags ?? []),
        m.description ?? ""
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
      {/* Tab-Navigation (inline) */}
      <div className="flex gap-2 pb-2">
        <TabButton label="Allgemein" current={active==="root"} onClick={() => setActive("root")} />
        <TabButton label="Modell" current={active==="model"} onClick={() => setActive("model")} />
        <TabButton label="Stil" current={active==="style"} onClick={() => setActive("style")} />
      </div>

      {active === "root" && (
        <div className="grid gap-4">
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold opacity-80">OpenRouter API-Key</h3>
            <div className="flex gap-2">
              <Input placeholder="sk-or-v1-..." value={apiKey ?? ""} onChange={(e)=>setApiKey(e.target.value || null)} aria-label="API-Key" />
              <Button variant="outline" onClick={()=>setApiKey(null)}>Löschen</Button>
            </div>
            <p className="text-xs opacity-60">Wird lokal (localStorage) gespeichert.</p>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold opacity-80">Hinweise</h3>
            {error && <div className="text-sm text-red-400">⚠ {error}</div>}
            {warnings.map((w,i)=> <div key={i} className="text-xs opacity-70">• {w}</div>)}
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold opacity-80">Schnellzugriff</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={()=>setActive("model")} variant="outline">Modell wählen</Button>
              <Button onClick={()=>setActive("style")} variant="outline">Stil wählen</Button>
            </div>
          </section>
        </div>
      )}

      {active === "model" && (
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <Input className="max-w-sm" placeholder="Suchen (id, name, tag)…" value={query} onChange={(e)=>setQuery(e.target.value)} aria-label="Modellsuche" />
            <Switch checked={!!filter.free} onCheckedChange={(v)=>setFilter(f=>({...f, free:v}))} label="Free" />
            <Switch checked={!!filter.allow_nsfw} onCheckedChange={(v)=>setFilter(f=>({...f, allow_nsfw:v}))} label="18+ erlaubt" />
            <Switch checked={!!filter.fast} onCheckedChange={(v)=>setFilter(f=>({...f, fast:v}))} label="Schnell" />
          </div>
          <div className="grid gap-2 max-h-[55dvh] overflow-auto pr-1">
            {modelsView.map((m)=>(
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 hover:bg-white/5">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{m.label ?? m.name ?? m.id}</div>
                  <div className="text-xs opacity-60 truncate">{m.description ?? m.id}</div>
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
            {modelsView.length === 0 && (
              <div className="text-sm opacity-70 p-2">Keine Modelle gefunden. Filter/Suche lockern.</div>
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
      className={"h-9 px-3 rounded-full text-sm border " + (current ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.1)]" : "border-white/15 hover:bg-white/5")}
      aria-current={current ? "page" : undefined}
    >{label}</button>
  );
}

function StyleCard({ s, onPick, currentId }: { s: PersonaStyle; onPick: (id: string|null)=>void; currentId?: string }) {
  const active = currentId === s.id;
  return (
    <button
      onClick={()=>onPick(s.id)}
      className={"w-full p-3 text-left rounded-2xl border transition " + (active ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.08)]" : "border-white/12 hover:bg-white/5")}
      aria-pressed={active}
    >
      <div className="font-medium">{s.name}</div>
      {s.description ? <div className="text-xs opacity-70 mt-0.5">{s.description}</div> : null}
      <div className="mt-2 text-[11px] opacity-60 line-clamp-3">{s.system}</div>
    </button>
  );
}
