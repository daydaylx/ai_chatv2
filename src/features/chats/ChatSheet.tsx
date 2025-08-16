import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useChatStore } from "@/entities/chat/store";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ChatSheet({ open, onClose }: Props) {
  const {
    chats,
    currentChatId,
    setCurrentChat,
    createChat,
    deleteChat,
    renameChat,
    duplicateChat
  } = useChatStore();

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(query));
  }, [q, chats]);

  if (!open) return null;

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
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Chats durchsuchen…"
              className="flex-1 rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => setQ("")}
              className="rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60"
            >
              Löschen
            </button>
            <button
              onClick={() => {
                const id = createChat();
                setCurrentChat(id);
                onClose();
              }}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Neuer Chat
            </button>
          </div>

          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((c) => (
              <li
                key={c.id}
                className={clsx(
                  "flex items-center gap-2 rounded-xl border p-3",
                  c.id === currentChatId ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                )}
              >
                <button
                  onClick={() => {
                    setCurrentChat(c.id);
                    onClose();
                  }}
                  className="flex-1 text-left"
                >
                  <div className="line-clamp-1 font-medium">{c.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(c.updatedAt).toLocaleString()}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded-lg border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-secondary/60"
                    onClick={() => {
                      const name = prompt("Neuer Titel:", c.title);
                      if (name && name.trim()) renameChat(c.id, name.trim());
                    }}
                    aria-label="Umbenennen"
                  >
                    Umben.
                  </button>
                  <button
                    className="rounded-lg border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-secondary/60"
                    onClick={() => duplicateChat(c.id)}
                    aria-label="Duplizieren"
                  >
                    Dupl.
                  </button>
                  <button
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                    onClick={() => {
                      if (confirm("Diesen Chat löschen?")) deleteChat(c.id);
                    }}
                    aria-label="Löschen"
                  >
                    Löschen
                  </button>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-xl border border-border bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
                Keine Treffer.
              </li>
            )}
          </ul>
        </div>
      </motion.div>
    </>
  );
}
