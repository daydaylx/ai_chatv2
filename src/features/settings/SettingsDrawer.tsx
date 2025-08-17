import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { OpenRouterClient } from "../../lib/openrouter";
import { ModelPicker } from "../models/ModelPicker";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  client: OpenRouterClient;
  modelId: string | "";
  onModelChange: (id: string) => void;
  onKeyChanged?: () => void;
  personaLabel?: string;
  onOpenPersona?: () => void;
  personaId?: string;
};

export default function SettingsDrawer({
  open,
  onClose,
  client,
  modelId,
  onModelChange,
  onKeyChanged,
  personaLabel,
  onOpenPersona,
  personaId,
}: Props) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const isMobile = useMemo(() => window.matchMedia("(max-width: 640px)").matches, []);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setKey(client.getApiKey());
      setShowKey(false);
    }
  }, [open, client]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function saveKey() {
    client.setApiKey(key.trim());
    onKeyChanged?.();
  }
  function clearKey() {
    client.clearApiKey();
    setKey("");
    onKeyChanged?.();
  }

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      {/* Panel */}
      <motion.div
        ref={sheetRef}
        initial={isMobile ? { y: "100%" } : { x: "100%" }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: "100%" } : { x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className={clsx(
          "fixed z-50 bg-background border",
          isMobile
            ? "left-0 right-0 bottom-0 rounded-t-2xl border-t border-border"
            : "top-0 bottom-0 right-0 w-full max-w-md border-l"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Einstellungen"
      >
        <div className="glass-heavy p-4 border-b border-border/50 rounded-t-2xl">
          <div className="container-mobile flex items-center justify-between px-0">
            <h2 className="text-lg font-bold">Einstellungen</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </motion.button>
          </div>
        </div>

        <div className="max-h-[65vh] sm:max-h-none overflow-y-auto">
          <div className="container-mobile py-4 space-y-6">
            {/* API-Key */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-[hsl(var(--muted-foreground))]">API-Key</h3>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  className="w-full h-11 px-3 pr-12 rounded-xl bg-secondary/60 border border-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/30"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-foreground"
                  aria-label={showKey ? "Key verbergen" : "Key anzeigen"}
                >
                  {showKey ? "🙈" : "👁️"}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveKey}
                  disabled={!key.trim()}
                  className={clsx(
                    "flex-1 h-10 rounded-xl font-medium",
                    key.trim()
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary/60 text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                  )}
                >
                  Speichern
                </button>
                <button
                  onClick={clearKey}
                  className="h-10 px-3 rounded-xl font-medium bg-secondary/60 hover:bg-secondary/70"
                >
                  Löschen
                </button>
              </div>
            </div>

            {/* Modell */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-[hsl(var(--muted-foreground))]">Modell</h3>
              <ModelPicker value={modelId || ""} onChange={onModelChange} client={client} personaId={personaId} />
              {modelId && (
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Aktiv: <code className="px-2 py-1 rounded bg-secondary/60">{modelId}</code>
                </div>
              )}
            </div>

            {/* Stil */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-[hsl(var(--muted-foreground))]">Antwort-Stil</h3>
              <button
                onClick={onOpenPersona}
                className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-white/10 text-left font-medium hover:bg-secondary/70"
              >
                {personaLabel || "Stil wählen…"}
              </button>
            </div>
          </div>
        </div>

        <div className="safe-b" />
      </motion.div>
    </>
  );
}
