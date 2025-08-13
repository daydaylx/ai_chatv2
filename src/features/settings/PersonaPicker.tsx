import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PRESETS } from "../../lib/presets";
import clsx from "clsx";

type Props = {
  visible: boolean;
  currentId: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

export default function PersonaPicker({ visible, currentId, onPick, onClose }: Props) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? PRESETS.filter(p => (p.label + " " + p.description).toLowerCase().includes(term)) : PRESETS;
  }, [q]);

  if (!visible) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed left-0 right-0 bottom-0 z-50 bg-background rounded-t-2xl border-t border-border max-h-[82vh] overflow-hidden"
        role="dialog" aria-modal="true" aria-label="Antwort-Stil auswählen"
      >
        <div className="glass-heavy p-4 border-b border-border/50 rounded-t-2xl">
          <div className="container-mobile px-0 flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Stile durchsuchen…"
              className="flex-1 h-10 px-3 rounded-xl bg-secondary/60 border border-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={onClose} className="h-10 px-3 rounded-xl bg-secondary/60 hover:bg-secondary/70">Fertig</button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div className="container-mobile py-4 grid grid-cols-1 gap-3">
            {list.map((preset, idx) => (
              <motion.button
                key={preset.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => { onPick(preset.id); onClose(); }}
                className={clsx(
                  "text-left rounded-2xl p-4",
                  currentId === preset.id
                    ? "glass-heavy border-2 border-primary"
                    : "glass hover:bg-card/60"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-full border-2 mt-0.5",
                      currentId === preset.id ? "border-primary bg-primary" : "border-[hsl(var(--muted-foreground))]"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] leading-snug line-clamp-3">
                      {preset.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="safe-b" />
      </motion.div>
    </>
  );
}
