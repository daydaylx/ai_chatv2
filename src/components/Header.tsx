import * as React from "react";
import Button from "../shared/ui/Button";
import { useSettings } from "../entities/settings/store";
import { useSession } from "../entities/session/store";

export default function Header({ onOpenSettings, onOpenSessions }: { onOpenSettings: () => void; onOpenSessions: () => void; }) {
  const settings = useSettings();
  const sess = useSession();
  const title = sess.sessions.find(s => s.id === sess.currentId)?.title ?? "Disa AI";

  return (
    <header className="sticky top-0 z-40 bg-[hsl(var(--surface-2))]/95 backdrop-blur border-b border-white/12">
      <div className="mx-auto max-w-screen-sm px-3 h-12 flex items-center justify-between">
        <div className="text-sm font-semibold truncate max-w-[45vw]" title={title}>{title}</div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-xs text-white/70 max-w-[30vw] truncate">{settings.modelId ?? "Modell wählen"}</div>
          <Button variant="outline" size="sm" onClick={onOpenSessions}>Sessions</Button>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>Einstellungen</Button>
        </div>
      </div>
    </header>
  );
}
