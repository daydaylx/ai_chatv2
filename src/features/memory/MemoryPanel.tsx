import { useMemo, useState } from "react";
import { useChatStore, type Chat } from "@/stores/chat-store";

export default function MemoryPanel() {
  // Wichtig: currentChat ist eine Eigenschaft (kein Funktionsaufruf!)
  const current = useChatStore((s) => s.currentChat);
  const setChatSummary = useChatStore((s) => s.setChatSummary);
  const addMemory = useChatStore((s) => s.addMemory);
  const updateMemory = useChatStore((s) => s.updateMemory);
  const deleteMemory = useChatStore((s) => s.deleteMemory);
  const setMemAuto = useChatStore((s) => s.setMemAuto);

  // Lokale States für UI
  const [summaryDraft, setSummaryDraft] = useState(current?.summary ?? "");
  const [newMem, setNewMem] = useState("");

  // Wenn der aktuelle Chat wechselt → lokale Entwürfe nachziehen
  useMemo(() => {
    setSummaryDraft(current?.summary ?? "");
    setNewMem("");
  }, [current?.id]); // eslint-disable-line

  if (!current) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Kein Chat ausgewählt. Bitte zuerst einen Chat öffnen.
      </div>
    );
  }

  const mems = (current.memories ?? []) as string[];
  const memAutoEnabled = !!current.memAuto;

  const saveSummary = () => {
    if (!summaryDraft.trim()) return;
    setChatSummary(current.id, summaryDraft.trim());
  };

  const handleAddMem = () => {
    const v = newMem.trim();
    if (!v) return;
    addMemory(current.id, v);
    setNewMem("");
  };

  const handleUpdateMem = (index: number, value: string) => {
    const v = value.trim();
    if (!v) return;
    updateMemory(current.id, index, v);
  };

  const handleDeleteMem = (index: number) => {
    deleteMemory(current.id, index);
  };

  const toggleMemAuto = () => {
    setMemAuto(current.id, !memAutoEnabled);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Zusammenfassung */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Chat-Zusammenfassung</h3>
        <textarea
          value={summaryDraft}
          onChange={(e) => setSummaryDraft(e.target.value)}
          placeholder="Kurze Zusammenfassung dieses Chats …"
          className="w-full min-h-[84px] rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex justify-end">
          <button
            onClick={saveSummary}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Speichern
          </button>
        </div>
      </section>

      {/* Memory Auto */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Automatische Memories</h3>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={memAutoEnabled}
              onChange={toggleMemAuto}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-muted-foreground">aktiv</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Wenn aktiv, kann der Assistent wichtige Fakten (z.&nbsp;B. Vorlieben, Ziele) automatisch als Memory ablegen.
        </p>
      </section>

      {/* Memories */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Memories</h3>

        {mems.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-sm text-muted-foreground">
            Noch keine Memories gespeichert.
          </div>
        ) : (
          <ul className="space-y-2">
            {mems.map((m: string, idx: number) => (
              <li key={`${idx}-${m.slice(0, 10)}`} className="flex items-start gap-2">
                <textarea
                  defaultValue={m}
                  onBlur={(e) => handleUpdateMem(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => handleDeleteMem(idx)}
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-2 text-xs text-destructive hover:bg-destructive/20"
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center gap-2">
          <input
            value={newMem}
            onChange={(e) => setNewMem(e.target.value)}
            placeholder="Neue Memory hinzufügen…"
            className="flex-1 rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleAddMem}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Hinzufügen
          </button>
        </div>
      </section>
    </div>
  );
}
