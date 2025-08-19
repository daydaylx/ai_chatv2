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
import { useModelCatalog } from "../../lib/catalog";
import { getAccent, setAccent, Accent } from "../../shared/lib/theme";
import { ruleForStyle, isModelAllowed } from "../../config/styleModelRules";

type Tab = "root" | "model" | "style" | "onboarding";
type Props = { open: boolean; tab: Tab; onClose: () => void; };

export default function SettingsSheet({ open, tab, onClose }: Props) {
  const [active, setActive] = React.useState<Tab>(tab);
  React.useEffect(() => setActive(tab), [tab]);

  const persona = React.useContext(PersonaContext);
  const settings = useSettings();
  const { apiKey, setApiKey } = useClient();

  // Accent
  const [accent, setAccentState] = React.useState<Accent>(() => getAccent());
  const changeAccent = (a: Accent) => { setAccent(a); setAccentState(a); };

  // Katalog
  const catalog = useModelCatalog({ local: persona.data.models, apiKey });

  // Filter & Suche
  const [filter, setFilter] = React.useState<Filter>({ free: false, allow_nsfw: false, fast: false });
  const [query, setQuery] = React.useState("");

  // Basisliste
  const baseAll = React.useMemo(
    () => sortModels(filterModels(catalog.models as any, filter), settings.favorites),
    [catalog.models, filter, settings.favorites]
  );

  // Stilabhängige Einschränkung (ID + Name)
  const currentStyle = React.useMemo(
    () => persona.data.styles.find(x => x.id === (settings.personaId ?? "")) ?? null,
    [persona.data.styles, settings.personaId]
  );
  const styleRule = ruleForStyle(settings.personaId ?? null, currentStyle?.name ?? null);

  const base = React.useMemo(() => {
    if (!styleRule) return baseAll;
    return baseAll.filter(m => isModelAllowed(styleRule, m.id, (m as any).name ?? (m as any).label ?? null));
  }, [baseAll, styleRule]);

  // Suche anwenden
  const view = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(m => {
      const hay = [
        m.id, (m as any).name ?? "", (m as any).label ?? "",
        ...(((m as any).tags ?? []) as string[]),
        (m as any).description ?? ""
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [base, query]);

  const onPickModel = (id: string) => { settings.setModelId(id); setActive("root"); };
  const onPickStyle = (id: string | null) => { settings.setPersonaId(id); setActive("root"); };

  const isLoading = catalog.status === "loading";
  const hasError = catalog.status === "error";

  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen" ariaLabel="Einstellungen">
      {/* Tabs */}
      <div className="flex gap-2 pb-2 flex-wrap">
        <TabButton label="Allgemein" current={active==="root"} onClick={() => setActive("root")} />
        <TabButton label={`Modell${view.length ? ` (${view.length})` : ""}`} current={active==="model"} onClick={() => setActive("model")} />
        <TabButton label="Stil" current={active==="style"} onClick={() => setActive("style")} />
      </div>

      {active === "root" && (
        <div className="grid gap-5">
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-2">OpenRouter API-Key</h3>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="sk-or-v1-..."
                value={apiKey ?? ""}
                onChange={(e)=> setApiKey(e.target.value || null)}
                aria-label="API-Key"
              />
              <Button variant="outline" onClick={()=>catalog.refresh()} aria-label="Modelle neu laden">Neu laden</Button>
              <Button variant="outline" onClick={()=>{ setApiKey(null); }} aria-label="API-Key löschen">Löschen</Button>
            </div>
            <div className="text-xs text-3">
              Wird lokal (localStorage) gespeichert. {isLoading ? "Lade Modelle…" : hasError ? "Remote-Modelle nicht verfügbar – lokale Metadaten angezeigt." : "Modelle geladen."}
            </div>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-2">Akzentfarbe</h3>
            <div className="flex gap-2 flex-wrap">
              <AccentChip a="violet" current={accent} onPick={changeAccent} />
              <AccentChip a="amber" current={accent} onPick={changeAccent} />
              <AccentChip a="jade" current={accent} onPick={changeAccent} />
              <AccentChip a="blue" current={accent} onPick={changeAccent} />
            </div>
            <div className="text-xs text-3">Wirkt sofort und wird gespeichert.</div>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-2">Hinweise</h3>
            {persona.error && <div className="text-sm text-red-400">⚠ {persona.error}</div>}
            {persona.warnings.map((w,i)=> <div key={i} className="text-xs text-3">• {w}</div>)}
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-2">Schnellzugriff</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={()=>setActive("model")} variant="outline">Modell wählen</Button>
              <Button onClick={()=>setActive("style")} variant="outline">Stil wählen</Button>
            </div>
          </section>
        </div>
      )}

      {active === "model" && (
        <div className="grid gap-3">
          <div className="flex flex-col gap-2">
            <Input placeholder="Suchen (id, name, tag)…" value={query} onChange={(e)=>setQuery(e.target.value)} aria-label="Modellsuche" />
            <div className="flex items-center gap-3 flex-wrap">
              <Switch checked={!!filter.free} onCheckedChange={(v)=>setFilter(f=>({...f, free:v}))} label="Free" />
              <Switch checked={!!filter.allow_nsfw} onCheckedChange={(v)=>setFilter(f=>({...f, allow_nsfw:v}))} label="18+ erlaubt" />
              <Switch checked={!!filter.fast} onCheckedChange={(v)=>setFilter(f=>({...f, fast:v}))} label="Schnell" />
              <span className="text-xs text-3">{isLoading ? "Lädt…" : `${view.length} Treffer`}</span>
              {styleRule && <span className="text-xs text-3">· durch Stil eingeschränkt</span>}
              {hasError && <button className="text-xs underline opacity-80 hover:opacity-100" onClick={()=>catalog.refresh()}>Erneut versuchen</button>}
            </div>
          </div>

          <div className="grid gap-2 max-h-[55dvh] overflow-auto pr-1">
            {isLoading && <div className="text-sm opacity-80 flex items-center gap-2"><Spinner/> Modelle laden…</div>}

            {!isLoading && view.map((m)=>(
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-1 hover:bg-accent-soft">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{(m as any).label ?? (m as any).name ?? m.id}</div>
                  <div className="text-xs text-3 truncate">{(m as any).description ?? m.id}</div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {(m as any).free ? <Badge>Free</Badge> : null}
                    {(m as any).allow_nsfw ? <Badge>18+</Badge> : null}
                    {((m as any).context ?? (m as any).ctx) ? <Badge>ctx {(m as any).context ?? (m as any).ctx}</Badge> : null}
                    {(m as any).fast ? <Badge>Fast</Badge> : null}
                    {(((m as any).tags ?? []) as string[]).slice(0,3).map((t)=> <Badge key={t}>{t}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={()=>onPickModel(m.id)} aria-label={`Modell ${m.id} wählen`}>Wählen</Button>
                  <button
                    className="h-9 w-9 rounded-full border border-1 hover:bg-accent-soft"
                    aria-label="Favorit umschalten"
                    onClick={()=>useSettings.getState().toggleFavorite(m.id)}
                    title="Favorit"
                  >{useSettings.getState().favorites?.[m.id] ? "★" : "☆"}</button>
                </div>
              </div>
            ))}

            {!isLoading && view.length === 0 && (
              <div className="text-sm opacity-85 p-2">
                {styleRule
                  ? "Keine Modelle innerhalb der Stil-Einschränkung gefunden. Prüfe Regeln oder entferne die Stilbindung."
                  : "Keine Modelle gefunden. Suche/Filter anpassen."}
              </div>
            )}
          </div>
        </div>
      )}

      {active === "style" && (
        <div className="grid gap-3 max-h-[62dvh] overflow-auto pr-1">
          {persona.data.styles.map((s)=> <StyleCard key={s.id} s={s} currentId={useSettings.getState().personaId ?? undefined} onPick={onPickStyle} />)}
        </div>
      )}
    </Sheet>
  );
}

function TabButton({ label, current, onClick }: { label: string; current: boolean; onClick: ()=>void }) {
  return (
    <button
      onClick={onClick}
      className={"h-9 px-3 rounded-full text-sm border " + (current ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.12)]" : "border-1 hover:bg-accent-soft")}
      aria-current={current ? "page" : undefined}
    >{label}</button>
  );
}

function StyleCard({ s, onPick, currentId }: { s: PersonaStyle; onPick: (id: string|null)=>void; currentId?: string }) {
  const active = currentId === s.id;
  return (
    <button
      onClick={()=>onPick(s.id)}
      className={"w-full p-3 text-left rounded-2xl border transition " + (active ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.10)]" : "border-1 hover:bg-accent-soft")}
      aria-pressed={active}
    >
      <div className="font-medium">{s.name}</div>
      {s.description ? <div className="text-xs text-3 mt-0.5">{s.description}</div> : null}
      <div className="mt-2 text-[11px] text-3 line-clamp-3">{s.system}</div>
    </button>
  );
}

function AccentChip({ a, current, onPick }: { a: Accent; current: Accent; onPick: (a: Accent)=>void }) {
  const label = { violet: "Violett", amber: "Amber", jade: "Jade", blue: "Blau" }[a];
  const selected = current === a;
  return (
    <button
      onClick={()=>onPick(a)}
      className={
        "h-9 px-3 rounded-full text-sm border " +
        (selected ? "border-[hsl(var(--accent-400))] bg-[hsl(var(--accent-100)/0.14)]" : "border-1 hover:bg-accent-soft")
      }
      data-accent-preview={a}
      aria-pressed={selected}
      title={label}
    >
      {label}
    </button>
  );
}
