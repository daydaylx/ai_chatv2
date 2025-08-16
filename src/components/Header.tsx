import { motion } from "framer-motion";
import clsx from "clsx";
import { useChatStore } from "@/entities/chat/store";

interface HeaderProps {
  keySet: boolean;
  onOpenSettings: () => void;
}

export function Header({ keySet, onOpenSettings }: HeaderProps) {
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <motion.header
      className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Titel / Aktive Session */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">
          {activeSession?.title ?? "Disa AI"}
        </span>
      </div>

      {/* Aktionen */}
      <div className="flex items-center gap-3">
        {/* Settings Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenSettings}
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/60 text-foreground transition-all hover:bg-secondary"
          )}
          aria-label="Einstellungen"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.983 2.25c-.94 0-1.82.56-2.216 1.43l-.502 1.092a1.725 1.725 0 01-1.678 1.015H5.25c-.966 0-1.75.784-1.75 1.75v2.337c0 .708.417 1.34 1.065 1.608l1.092.502c.87.396 1.43 1.276 1.43 2.216v1.337c0 .94-.56 1.82-1.43 2.216l-1.092.502A1.725 1.725 0 013.5 19.913v2.337c0 .966.784 1.75 1.75 1.75h2.337c.708 0 1.34-.417 1.608-1.065l.502-1.092c.396-.87 1.276-1.43 2.216-1.43h1.337c.94 0 1.82.56 2.216 1.43l.502 1.092c.268.648.9 1.065 1.608 1.065h2.337c.966 0 1.75-.784 1.75-1.75v-2.337c0-.708-.417-1.34-1.065-1.608l-1.092-.502c-.87-.396-1.43-1.276-1.43-2.216V14.25c0-.94.56-1.82 1.43-2.216l1.092-.502c.648-.268 1.065-.9 1.065-1.608V7.587c0-.966-.784-1.75-1.75-1.75h-2.337c-.708 0-1.34-.417-1.608-1.065l-.502-1.092a2.247 2.247 0 00-2.216-1.43h-1.337z"
            />
          </svg>
        </motion.button>

        {/* Key Status */}
        <div
          className={clsx(
            "h-2 w-2 rounded-full",
            keySet
              ? "bg-[hsl(var(--disa-ok))] animate-pulse"
              : "bg-destructive"
          )}
          title={keySet ? "API-Key gesetzt" : "Kein API-Key"}
        />
      </div>
    </motion.header>
  );
}
