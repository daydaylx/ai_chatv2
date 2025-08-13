import { motion } from "framer-motion";
import clsx from "clsx";

type Props = {
  title?: string;
  keySet: boolean;
  modelLabel?: string;
  onOpenSettings: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export default function Header({
  title = "AI Chat",
  keySet,
  modelLabel,
  onOpenSettings,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <motion.header initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="safe-t sticky top-0 z-50">
      <div className="container-mobile">
        <div className="glass elev-1 h-12 rounded-2xl px-3 flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-2">
            <div className="font-semibold text-gradient fluid-title leading-none truncate">{title}</div>
            <span
              className={clsx(
                "truncate text-xs px-2 py-1 rounded-full border",
                "bg-primary/10 border-primary/20 text-primary"
              )}
              title={modelLabel}
            >
              {modelLabel || "Kein Modell"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              aria-label="Theme wechseln"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v2m0 12v2M4 12H2m20 0h-2M6.3 6.3l-1.4-1.4m14.2 14.2-1.4-1.4m0-11.4 1.4-1.4M4.9 19.1l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              aria-label="Einstellungen"
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="m19.4 15 .8 1.4-1.7 3-1.6-.2a7.8 7.8 0 0 1-1.8 1l-.4 1.6h-3.4l-.4-1.6a7.8 7.8 0 0 1-1.8-1l-1.6.2-1.7-3 .8-1.4a7.6 7.6 0 0 1 0-2.1L4.2 11 5.9 8l1.6.2c.6-.4 1.2-.8 1.8-1l.4-1.6h3.4l.4 1.6c.6.2 1.2.6 1.8 1l1.6-.2 1.7 3-1 .9c.1.7.1 1.4 0 2.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>

            <span className={clsx("w-2 h-2 rounded-full", keySet ? "bg-emerald-500" : "bg-destructive")} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
