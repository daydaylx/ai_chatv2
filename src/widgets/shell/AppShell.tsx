import { ReactNode, useState } from "react";
import { Button } from "../../shared/ui/Button";
import { SettingsSheet } from "../../features/settings/SettingsSheet";
import { useSettings } from "../../entities/settings/store";
import { motion } from "framer-motion";

type Props = { children: ReactNode };

export function AppShell({ children }: Props) {
  const [open, setOpen] = useState(false);
  const { modelId, personaId } = useSettings();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.24 }}
        className="sticky top-0 z-[100] h-[64px] border-b border-border 
                   bg-[linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,.18))] 
                   backdrop-blur-lg"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <motion.h1
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="text-lg font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
          >
            AI Chat
          </motion.h1>
          <div className="flex items-center gap-2">
            <span className="text-xs rounded-full border border-white/15 bg-black/20 px-2 py-1">
              {modelId ?? "kein Modell"}
            </span>
            <span className="text-xs rounded-full border border-white/15 bg-white/10 px-2 py-1">
              {personaId ?? "Stil: —"}
            </span>
            <Button className="h-9 px-3" onClick={() => setOpen(true)}>
              Einstellungen
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-6xl p-3 sm:p-4">{children}</main>

      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
