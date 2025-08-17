import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSettings } from "../../entities/settings/store";
import { OpenRouterClient } from "../../lib/openrouter";
import { loadPersonaData } from "../../api";
import { globAny } from "../../lib/glob";
import { PersonaContext } from "../../entities/persona";
import { isModelAllowedForStyle } from "../../lib/personaUtils";

type PM = { id: string; label: string; tags?: string[]; context?: number };
type PG = { id: string; name: string; include?: string[]; exclude?: string[]; tags?: string[] };

export default function ModelPicker() {
  const s = useSettings() as any;
  const { data } = useContext(PersonaContext);
  const [persona, setPersona] = useState<{ models: PM[]; groups: PG[] }>({ models: [], groups: [] });
  const [listed, setListed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<{ free?: boolean; roleplay?: boolean; nsfw?: boolean }>({});

  useEffect(() => {
    (async () => {
      const res = await loadPersonaData();
      setPersona({ models: res.data.models as PM[], groups: (res.data.modelGroups || []) as PG[] });
    })();
  }, []);

  // Availability unter API-Key
  useEffect(() => {
    const client = new OpenRouterClient(s?.apiKey || null);
    (async () => {
      const remote = await client.listModels();
      setListed(new Set(remote.map(m => m.id)));
    })();
  }, [s?.apiKey]);

  const grouped = useMemo(() => {
    const out: { group: PG; items: PM[] }[] = [];
    const used = new Set<string>();

    const matches = (m: PM, g: PG) => {
      const byInclude = g.include?.length ? globAny(g.include, m.id) : false;
      const byTags = g.tags?.length ? (m.tags || []).some(t => g.tags!.includes(t)) : false;
      const ok = byInclude || byTags;
      const ex = g.exclude?.length ? globAny(g.exclude, m.id) : false;
      return ok && !ex;
    };

    for (const g of persona.groups) {
      const items = persona.models.filter(m => !used.has(m.id) && matches(m, g));
      items.forEach(m => used.add(m.id));
      out.push({ group: g, items });
    }

    // Rest nach Provider gruppieren
    const rest = persona.models.filter(m => !used.has(m.id));
    const byProvider = new Map<string, PM[]>();
    for (const m of rest) {
      const prov = m.id.split("/")[0] || "Andere";
      if (!byProvider.has(prov)) byProvider.set(prov, []);
      byProvider.get(prov)!.push(m);
    }
    for (const [prov, items] of byProvider) {
      out.push({ group: { id: prov, name: prov.toUpperCase() }, items });
    }

    return out;
  }, [persona]);

  const activeId = s?.modelId || "";
  const activeStyle = useMemo(() => data.styles.find(st => st.id === (s?.styleId || "neutral")) || null, [data.styles, s?.styleId]);

  const canPassFilter = (m: PM) => {
    const tags = (m.tags || []);
    if (filter.free && !(tags.includes("free") || m.id.endsWith(":free"))) return false;
    if (filter.roleplay && !tags.includes("roleplay")) return false;
    if (filter.nsfw && !tags.includes("nsfw")) return false;
    return true;
  };

  return (
    <div className="p-3 text-sm text-white">
      <div className="mb-3 flex gap-2 flex-wrap">
        <button className={"px-2 py-1 rounded border " + (filter.free ? "bg-[var(--accent)] text-black" : "bg-white/5")} onClick={() => setFilter(f => ({ ...f, free: !f.free }))}>FREE</button>
        <button className={"px-2 py-1 rounded border " + (filter.roleplay ? "bg-[var(--accent)] text-black" : "bg-white/5")} onClick={() => setFilter(f => ({ ...f, roleplay: !f.roleplay }))}>ROLEPLAY</button>
        <button className={"px-2 py-1 rounded border " + (filter.nsfw ? "bg-[var(--accent)] text-black" : "bg-white/5")} onClick={() => setFilter(f => ({ ...f, nsfw: !f.nsfw }))}>NSFW</button>
      </div>

      {grouped.map(({ group, items }) => {
        const vis = items.filter(m => canPassFilter(m));
        if (vis.length === 0) return null;
        return (
          <div key={group.id} className="mb-4">
            <div className="opacity-70 mb-1">{group.name}</div>
            <div className="flex flex-col gap-2">
              {vis.map(m => {
                const isListed = listed.has(m.id);
                const allowedByStyle = isModelAllowedForStyle(m.id, activeStyle);
                const disabled = !isListed || !allowedByStyle;
                const isActive = activeId === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={disabled}
                    onClick={() => s.setModelId?.(m.id)}
                    className={
                      "text-left rounded-xl px-3 py-2 border " +
                      (isActive ? "border-[var(--accent)] bg-[color:rgb(217_119_6_/_0.10)]" : "border-white/10 bg-white/5 hover:bg-white/10") +
                      (disabled ? " opacity-60 cursor-not-allowed" : "")
                    }
                    title={!isListed ? "Nicht unter deinem API-Key gelistet" : (!allowedByStyle ? "Vom aktiven Stil blockiert" : "")}
                  >
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs opacity-70">{m.id}</div>
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {!!m.context && <span className="text-[10px] px-2 py-0.5 rounded bg-white/10">ctx {m.context}</span>}
                      {(m.tags || []).slice(0, 6).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/10">{t}</span>
                      ))}
                      {!isListed && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40">nicht gelistet</span>}
                      {!allowedByStyle && <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40">vom Stil blockiert</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
