import * as React from "react";
import Button from "../shared/ui/Button";
import { useSettings } from "../entities/settings/store";

export default function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const settings = useSettings();
  return (
    <header className="sticky top-0 z-40 bg-[hsl(var(--surface-2))]/95 backdrop-blur border-b border-white/12">
      <div className="mx-auto max-w-screen-sm px-3 h-12 flex items-center justify-between">
        <div className="text-sm font-semibold">Disa AI</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-white/70 max-w-[40vw] truncate">{settings.modelId ?? "Modell wählen"}</div>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>Einstellungen</Button>
        </div>
      </div>
    </header>
  );
}
