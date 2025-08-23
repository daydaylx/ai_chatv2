import React from 'react';
import type { Persona, PersonaModel } from '@/types/models';
import ModelRow from './ModelRow';

type Props = {
  personas: Persona[];
  value?: string; // selected model id
  onChange?: (modelId: string) => void;
};

export default function ModelPicker({ personas, value, onChange }: Props) {
  const allModels: PersonaModel[] = React.useMemo(
    () => personas.flatMap(p => p.models ?? []),
    [personas]
  );

  if (!personas.length || !allModels.length) {
    return (
      <div className="rounded-md border p-4 bg-card">
        <p className="text-sm text-muted-foreground">
          Keine Modelle gefunden. Lege eine <code>src/data/personas.json</code> mit gültigen Personas/Modellen an
          (oder prüfe Build/Import).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card divide-y">
      {allModels.map((m) => (
        <ModelRow
          key={m.id}
          model={m}
          selected={value === m.id}
          onSelect={(id) => onChange?.(id)}
        />
      ))}
    </div>
  );
}
