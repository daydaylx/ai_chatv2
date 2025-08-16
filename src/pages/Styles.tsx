import React from "react";
import type { StylePreset } from "@/types";
import { defaultPresets } from "@/data/defaultStyles";
import { loadPresets, savePresets } from "@/lib/storage";
import { StyleCard } from "@/components/styles/StyleCard";
import { StyleEditor } from "@/components/styles/StyleEditor";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ExportImport } from "@/components/styles/ExportImport";
import { useNavigate } from "react-router-dom";

export default function Styles() {
  const navigate = useNavigate();
  const [presets, setPresets] = React.useState<StylePreset[]>(() => {
    const existing = loadPresets();
    if (existing.length > 0) return existing;
    savePresets(defaultPresets);
    return defaultPresets;
  });

  const [editing, setEditing] = React.useState<StylePreset | null>(null);
  const [open, setOpen] = React.useState(false);

  function handleSave(p: StylePreset) {
    const list = [...presets];
    const idx = list.findIndex((x) => x.id === p.id);
    if (idx >= 0) list[idx] = p;
    else list.unshift(p);
    setPresets(list);
    savePresets(list);
    setOpen(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Diesen Stil wirklich löschen?")) return;
    const list = presets.filter((p) => p.id !== id);
    setPresets(list);
    savePresets(list);
  }

  function handleImport(list: StylePreset[]) {
    setPresets(list);
    savePresets(list);
  }

  function applyToBuilder(p: StylePreset) {
    // Übergibt ID per Query an den Builder
    navigate(`/builder?styleId=${encodeURIComponent(p.id)}`);
  }

  const [query, setQuery] = React.useState("");
  const filtered = presets.filter((p) =>
    (p.name + " " + (p.description ?? "") + " " + p.tags.join(" "))
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Stile</h2>
          <p className="muted">Systemprompts und Parameter verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input"
            placeholder="Suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Stile durchsuchen"
          />
          <ExportImport presets={presets} onImport={handleImport} />
          <Button onClick={() => { setEditing(null); setOpen(true); }}>Neu</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-6 text-center">Keine Stile gefunden.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <StyleCard
              key={p.id}
              preset={p}
              onEdit={(pp) => { setEditing(pp); setOpen(true); }}
              onDelete={handleDelete}
              onApplyToBuilder={applyToBuilder}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Stil bearbeiten" : "Neuer Stil"}>
        <StyleEditor
          value={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => { setOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}
