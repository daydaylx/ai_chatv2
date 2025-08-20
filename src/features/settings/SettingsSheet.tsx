import * as React from "react";
import Sheet from "../../shared/ui/Sheet";
import Button from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import Switch from "../../shared/ui/Switch";
import { Spinner } from "../../shared/ui/Spinner";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { useClient } from "../../lib/client";
import { useModelCatalog } from "../../lib/catalog";
import ModelPicker from "../models/ModelPicker";
import { getAccent, setAccent, type Accent } from "../../shared/lib/theme";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; };

export default function SettingsSheet({ open, onOpenChange }: Props) {
  const { data } = React.useContext(PersonaContext);
  const settings = useSettings();
  const { apiKey, setApiKey } = useClient();
  const catalog = useModelCatalog({ local: data.models as any, apiKey });

  const [q, setQ] = React.useState("");
  const [fFree, setFFree] = React.useState(false);
  const [fNSFW, setFNSFW] = React.useState(false);
  const [fFast, setFFast] = React.useState(false);

  const models = React.useMemo(() => {
    const all = catalog.models;
    const filtered = all.filter(m => {
      if (fFree && !m.free) return false;
      if (fNSFW && !m.allow_nsfw) return false;
      if (fFast && !m.fast) return false;
      return true;
    });
    const s = q.trim().toLowerCase();
    if (!s) return filtered;
    return filtered.filter(m =>
      [m.id, m.name ?? "", m.description ?? "", ...(m.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [catalog.models, q, fFree, fNSFW, fFast]);

  const [accent, setAcc] = React.useState<Accent>(() => getAccent());
  const changeAccent = (a: Accent) => { setAccent(a); setAcc(a); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Einstellungen">
      <Tabs>
        <Tab title="Modelle">
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold">OpenRouter API-Key</h3>
            <div className="flex gap-2 items-center">
              <Input placeholder="sk-or-v1-..." value={apiKey ?? ""} onChange={(e) => setApiKey(e.target.value || null)} aria-label="API-Key" />
              <Button variant="outline" onClick={() => catalog.refresh()} aria-label="Neu laden">Neu laden</Button>
              <Button variant="outline" onClick={() => setApiKey(null)} aria-label="Löschen">Löschen</Button>
            </div>
            <div className="text-xs text-white/70">
              {catalog.loading ? (<span className="inline-flex items-center gap-2"><Spinner/> Modelle laden…</span>)
                : catalog.error ? "Remote-Modelle nicht verfügbar – zeige lokale Metadaten."
                : "Modelle geladen."}
            </div>
          </section>

          <section className="grid gap-2 mt-3">
            <h3 className="text-sm font-semibold">Filter & Suche</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2"><Switch checked={fFree} onCheckedChange={setFFree} /><span className="text-sm">Nur kostenlose</span></label>
              <label className="flex items-center gap-2"><Switch checked={fNSFW} onCheckedChange={setFNSFW} /><span className="text-sm">18+ erlaubt</span></label>
              <label className="flex items-center gap-2"><Switch checked={fFast} onCheckedChange={setFFast} /><span className="text-sm">Schnell</span></label>
            </div>
            <Input placeholder="Suchen (id, name, tag)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Modellsuche" />
          </section>

          <section className="grid gap-2 mt-3">
            <h3 className="text-sm font-semibold">Verfügbare Modelle</h3>
            <ModelPicker
              models={models.map(m => ({
                id: m.id, label: m.name ?? m.id, description: m.description ?? "",
                free: !!m.free, allow_nsfw: !!m.allow_nsfw, fast: !!m.fast
              }))}
              selectedId={settings.modelId ?? undefined}
              onSelect={(id) => settings.setModelId(id)}
              compact
              showBadges
            />
            <div className="text-xs text-white/70">{models.length} Treffer</div>
          </section>
        </Tab>

        <Tab title="Assistent">
          <section className="grid gap-3">
            <label className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Kontext automatisch zusammenfassen</div>
                <div className="text-xs text-white/70">Ab ~20 Nachrichten oder ~4 k Zeichen wird eine Kurzfassung erstellt.</div>
              </div>
              <Switch checked={settings.autoSummarize} onCheckedChange={settings.setAutoSummarize} />
            </label>

            <label className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Memory aktivieren</div>
                <div className="text-xs text-white/70">Extrahiert langlebige Präferenzen/Fakten in regelmäßigen Abständen.</div>
              </div>
              <Switch checked={settings.autoMemory} onCheckedChange={settings.setAutoMemory} />
            </label>

            <div className="grid gap-1">
              <div className="text-sm font-medium">Summarizer-Modell (optional)</div>
              <Input
                placeholder="z. B. mistral-small oder llama-3.1-8b"
                value={settings.summarizerModelId ?? ""}
                onChange={(e) => settings.setSummarizerModelId(e.target.value || null)}
                aria-label="Summarizer-Modell"
              />
              <div className="text-xs text-white/60">Leer lassen, um das Hauptmodell zu verwenden.</div>
            </div>
          </section>
        </Tab>

        <Tab title="Design">
          <h3 className="text-sm font-semibold mb-2">Akzentfarbe</h3>
          <div className="flex gap-2 flex-wrap">
            {(["violet","amber","jade","blue"] as Accent[]).map(a => (
              <button key={a} onClick={() => changeAccent(a)} className={["h-9 px-3 rounded-full border border-white/12 text-sm", a===accent ? "bg-[hsl(var(--accent-600))]/20 ring-2 ring-[hsl(var(--accent-600))]" : "hover:bg-white/6"].join(" ")}>{a}</button>
            ))}
          </div>
        </Tab>
      </Tabs>
    </Sheet>
  );
}

/** Minimaler Tabs-Wrapper */
function Tabs({ children }: { children: React.ReactNode }) {
  const [i, setI] = React.useState(0);
  const items = React.Children.toArray(children) as React.ReactElement[];
  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        {items.map((it, idx) => (
          <button key={idx} onClick={() => setI(idx)} className={["h-9 px-3 rounded-full border border-white/12 text-sm", idx===i ? "bg-[hsl(var(--accent-600))]/20 ring-2 ring-[hsl(var(--accent-600))]" : "hover:bg-white/6"].join(" ")}>{it.props.title}</button>
        ))}
      </div>
      <div>{items[i]}</div>
    </div>
  );
}
function Tab({ children }: { title: string; children: React.ReactNode }) { return <div className="grid gap-3">{children}</div>; }
