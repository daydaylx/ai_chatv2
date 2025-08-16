import React from "react";
import type { StylePreset } from "@/types";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type Props = {
  value?: StylePreset;
  onSave: (p: StylePreset) => void;
  onCancel?: () => void;
};

export const StyleEditor: React.FC<Props> = ({ value, onSave, onCancel }) => {
  const [name, setName] = React.useState(value?.name ?? "");
  const [desc, setDesc] = React.useState(value?.description ?? "");
  const [tags, setTags] = React.useState(value?.tags.join(", ") ?? "");
  const [systemPrompt, setSystemPrompt] = React.useState(value?.systemPrompt ?? "");
  const [temperature, setTemperature] = React.useState(value?.temperature ?? 0.5);
  const [topP, setTopP] = React.useState(value?.topP ?? 0.9);

  function handleSave() {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const preset: StylePreset = {
      id: value?.id ?? `style-${crypto.randomUUID()}`,
      name: name.trim(),
      description: desc.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      systemPrompt: systemPrompt.trim(),
      temperature: clamp(temperature, 0, 2),
      topP: clamp(topP, 0, 1),
      createdAt: value?.createdAt ?? now,
      updatedAt: now
    };
    onSave(preset);
  }

  return (
    <div className="space-y-4">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Tags (durch Komma getrennt)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <Textarea label="Beschreibung (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <Textarea
        label="Systemprompt"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        hint="Anweisungen, die den Stil definieren."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Temperatur (0–2)</label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={2}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="input w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">top_p (0–1)</label>
          <input
            type="number"
            step="0.05"
            min={0}
            max={1}
            value={topP}
            onChange={(e) => setTopP(Number(e.target.value))}
            className="input w-full mt-1"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Abbrechen</Button>}
        <Button onClick={handleSave}>Speichern</Button>
      </div>
    </div>
  );
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
