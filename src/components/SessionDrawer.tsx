import * as React from "react";
import Sheet from "../shared/ui/Sheet";
import Button from "../shared/ui/Button";
import { useSession } from "../entities/session/store";
import { formatRelative } from "../shared/lib/time";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  className?: string;
};

export default function SessionDrawer({ open, onOpenChange, className }: Props) {
  const sess = useSession();

  const onNew = async () => { await sess.newSession(); };
  const onSwitch = async (id: string) => { await sess.switchSession(id); onOpenChange(false); };
  const onRename = async (id: string, current: string) => {
    const title = prompt("Neuer Titel:", current ?? "Session");
    if (title == null) return;
    await sess.renameSession(id, title);
  };
  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Session „${title || "Unbenannt"}“ löschen?`)) return;
    await sess.removeSession(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Sessions" className={className ?? ""}>
      <div className="grid gap-3">
        <div className="flex justify-between items-center">
          <div className="text-sm text-white/70">{sess.sessions.length} gespeichert</div>
          <Button onClick={onNew} className="glow-ring">Neue Session</Button>
        </div>

        <div className="flex flex-col divide-y divide-white/8 rounded-xl border border-white/12 overflow-hidden glass-card">
          {sess.sessions.map((s) => {
            const active = s.id === sess.currentId;
            return (
              <div key={s.id} className={["p-3 sm:p-3.5 hover-lift transition-transform", active ? "bg-white/[0.06]" : "bg-transparent"].join(" ")}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onSwitch(s.id)}
                    className="flex-1 text-left min-w-0"
                    aria-current={active ? "true" : "false"}
                    title={s.title}
                  >
                    <div className="truncate font-medium">{s.title || "Unbenannt"}</div>
                    <div className="text-xs text-white/60">{formatRelative(s.updatedAt)}</div>
                  </button>
                  <div className="shrink-0 flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => onRename(s.id, s.title)} className="glow-ring">Umbenennen</Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(s.id, s.title)} className="glow-ring">Löschen</Button>
                  </div>
                </div>
              </div>
            );
          })}
          {sess.sessions.length === 0 && (
            <div className="p-3 text-sm text-white/70">Keine Sessions vorhanden.</div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
