import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { PRESETS } from "@/lib/presets";

type Props = {
  /** Sichtbarkeit steuern (Sheet-Modal) */
  visible: boolean;
  /** aktuell ausgewählte Persona-ID */
  currentId: string;
  /** Callback bei Auswahl */
  onPick: (id: string) => void;
  /** Sheet schließen */
  onClose: () => void;
};

export default function PersonaPicker({ visible, currentId, onPick, onClose }: Props) {
  const personas = PRESETS as Array<{
    id: string;
    label: string;
    description?: string;
    system?: string;
  }>;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border bg-background/95 shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 p-4">
              <div className="text-base font-semibold">Antwort-Stil auswählen</div>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="h-10 w-10 rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground hover:text-foreground"
                aria-label="Schließen"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* List */}
            <div className="max-h-[70vh] overflow-y-auto p-4 md:max-h-[60vh]">
              <div className="grid gap-2">
                {personas.map((p, index) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => {
                      onPick(p.id);
                      onClose();
                    }}
                    className={clsx(
                      "text-left",
                      "rounded-xl p-4 transition-all",
                      "hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring",
                      currentId === p.id
                        ? "border-2 border-primary bg-primary/10"
                        : "border border-border/60 bg-secondary/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          "mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2",
                          currentId === p.id ? "border-primary bg-primary" : "border-muted-foreground"
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{p.label}</div>
                        {p.description && (
                          <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.description}</div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 p-4">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Übernehmen
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
