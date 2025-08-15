import { motion } from "framer-motion";
import clsx from "clsx";
import { useConfigStore } from "../../entities/config/store";

type Props = {
  visible: boolean;
  currentId: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

export default function PersonaPicker({ visible, currentId, onPick, onClose }: Props) {
  const { personas, load, loaded, loading } = useConfigStore();
  if (!visible) return null;

  if (!loaded && !loading) void load();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-background rounded-2xl border border-border z-50 flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-border/50 bg-background/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Antwort-Stil auswählen</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-lg border border-border/60 bg-secondary/60 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!loaded ? (
            <div className="text-sm text-muted-foreground">Lade Personas…</div>
          ) : (
            <div className="grid gap-3">
              {personas.map((p, index) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onPick(p.id);
                    onClose();
                  }}
                  className={clsx(
                    "p-4 rounded-xl text-left transition-all",
                    currentId === p.id
                      ? "border-2 border-primary bg-primary/10"
                      : "border border-border/60 bg-secondary/50 hover:bg-secondary/60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0",
                        currentId === p.id ? "border-primary bg-primary" : "border-muted-foreground"
                      )}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{p.label}</h3>
                      {p.description && (
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/50 bg-background/70 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
          >
            Übernehmen
          </button>
        </div>
      </motion.div>
    </>
  );
}
