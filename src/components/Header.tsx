import { motion } from "framer-motion";
import clsx from "clsx";
import { useChatStore } from "@/entities/chat/store";

type Props = {
  title?: string;
  keySet: boolean;
  modelLabel?: string;
  onOpenSettings: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenChats?: () => void;
};

export default function Header({
  title = "Disa AI",
  keySet,
  modelLabel,
  onOpenSettings,
  theme,
  onToggleTheme,
  onOpenChats
}: Props) {
  const current = useChatStore((s) => s.currentChat());

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/70 px-3 backdrop-blur-xl md:px-4"
    >
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenChats}
          className="rounded-2xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm font-semibold text-gradient"
        >
          {title.slice(0, 2)} …
        </motion.button>

        {current?.title && (
          <span className="line-clamp-1 max-w-[45vw] rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:max-w-md">
            {current.title}
          </span>
        )}

        {modelLabel ? (
          <span className="hidden md:inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {modelLabel}
          </span>
        ) : (
          <span className="hidden md:inline-flex rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            Kein Modell
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Theme wechseln"
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Einstellungen"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.button>

        <div
          className={clsx("h-2 w-2 rounded-full", keySet ? "bg-[hsl(var(--disa-ok))] animate-pulse" : "bg-destructive")}
          title={keySet ? "API-Key gesetzt" : "Kein API-Key"}
        />
      </div>
    </motion.header>
  );
}
