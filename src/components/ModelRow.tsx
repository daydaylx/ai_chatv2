import React from 'react';
import type { PersonaModel } from '@/types/models';
import { getModelDisplayName } from '@/lib/modelMeta';

type Props = {
  model: PersonaModel;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export default function ModelRow({ model, selected, onSelect }: Props) {
  const title = getModelDisplayName(model);
  return (
    <button
      type="button"
      className={`model-row w-full rounded-md border px-3 text-left hover:bg-accent focus:bg-accent focus:outline-none ${selected ? 'bg-accent' : 'bg-background'}`}
      title={title}
      onClick={() => onSelect?.(model.id)}
      aria-pressed={selected}
    >
      <div className="title flex-1">
        <span>{title}</span>
      </div>
    </button>
  );
}
