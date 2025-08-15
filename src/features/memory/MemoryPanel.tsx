import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useChatStore } from "../../entities/chat/store";
import clsx from "clsx";

type Props = { open: boolean; onClose: () => void };

export default function MemoryPanel({ open, onClose }: Props) {
  const current = useChatStore((s) => s.currentChat());
  const setChatSummary = useChatStore((s) => s.setChatSummary);
  const addMemory = useChatStore((s) => s.addMemory);
  const updateMemory = useChatStore((s) => s.updateMemory);
  const deleteMemory = useChatStore((s) => s.deleteMemory);
  const settings = useChatStore((s) => s.settings);
  const setMemAuto = useChatStore((s) => s.setMemAuto);

  const [draft, setDraft] = useState(current?.summary ?? "");
  const [newMem, setNewMem] = useState("");

  if (!open || !current) return null;

  const chatId = current.id;
  const mems = current.memories ?? [];

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border border-border bg-background p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Kontext & Memories</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.memAuto}
                onChange={(e) => setMemAuto(e.target.checked)}
              />
              Auto-Memories
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Laufende Zusammenfassung</div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              placeholder="Kurz-Zusammenfassung des Chats …"
            />
            <div className="flex justify-end">
              <button
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={() => setChatSummary(chatId, draft.trim())}
              >
                Speichern
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Pinned Memories</div>
            <div className="flex gap-2">
              <input
                value={newMem}
                onChange={(e) => setNewMem(e.target.value)}
                placeholder="Neue Memory (Fakt) …"
                className="flex-1 rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => {
                  const t = newMem.trim();
                  if (!t) return;
                  addMemory(chatId, { text: t, pinned: true });
                  setNewMem("");
                }}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Hinzufügen
              </button>
            </div>

            <ul className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {mems.map((m) => (
                <li
                  key={m.id}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl border p-3",
                    m.pinned ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                  )}
                >
                  <button
                    className={clsx(
                      "h-5 w-5 rounded-full border-2",
                      m.pinned ? "border-primary bg-primary" : "border-muted-foreground"
                    )}
                    onClick={() => updateMemory(chatId, m.id, { pinned: !m.pinned })}
                    aria-label="Pin / Unpin"
                    title="Pin / Unpin"
                  />
                  <input
                    className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-border/60 focus:bg-secondary/50"
                    value={m.text}
                    onChange={(e) => updateMemory(chatId, m.id, { text: e.target.value })}
                  />
                  <button
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                    onClick={() => deleteMemory(chatId, m.id)}
                  >
                    Löschen
                  </button>
                </li>
              ))}
              {mems.length === 0 && (
                <li className="rounded-xl border border-border bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
                  Noch keine Memories.
                </li>
              )}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              className="rounded-lg border border-border/60 bg-secondary/60 px-4 py-2 text-sm hover:bg-secondary/70"
              onClick={onClose}
            >
              Schließen
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
