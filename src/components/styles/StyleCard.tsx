import React from "react";
import type { StylePreset } from "@/types";
import { Button } from "@/components/ui/Button";

type Props = {
  preset: StylePreset;
  onEdit: (p: StylePreset) => void;
  onDelete: (id: string) => void;
  onApplyToBuilder?: (p: StylePreset) => void;
};

export const StyleCard: React.FC<Props> = ({ preset, onEdit, onDelete, onApplyToBuilder }) => {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{preset.name}</h3>
          {preset.description && <p className="muted text-sm mt-0.5">{preset.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(preset)}>Bearbeiten</Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(preset.id)} aria-label="Löschen">🗑️</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {preset.tags.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{t}</span>
        ))}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm underline">Systemprompt anzeigen</summary>
        <pre className="mt-2 whitespace-pre-wrap text-sm p-3 panel">{preset.systemPrompt}</pre>
      </details>
      <div className="muted text-xs">
        Temp: {preset.temperature} · top_p: {preset.topP} · Aktualisiert: {new Date(preset.updatedAt).toLocaleString()}
      </div>
      {onApplyToBuilder && (
        <div>
          <Button onClick={() => onApplyToBuilder(preset)} className="w-full">Im Builder verwenden</Button>
        </div>
      )}
    </div>
  );
};
