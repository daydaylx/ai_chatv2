import React from "react";
import type { StylePreset } from "@/types";
import { Button } from "@/components/ui/Button";
import { exportPresetsToJson, importPresetsFromJson } from "@/lib/storage";

type Props = {
  presets: StylePreset[];
  onImport: (list: StylePreset[]) => void;
};

export const ExportImport: React.FC<Props> = ({ presets, onImport }) => {
  const fileRef = React.useRef<HTMLInputElement>(null);

  function onExport() {
    const json = exportPresetsToJson(presets);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "style-presets.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const list = importPresetsFromJson(text);
      onImport(list);
    } catch (err: any) {
      alert(`Import fehlgeschlagen: ${err?.message ?? String(err)}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={onExport}>Exportieren</Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={onImportFile}
        className="hidden"
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()}>Importieren</Button>
    </div>
  );
};
