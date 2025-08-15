import { motion } from "framer-motion";
import clsx from "clsx";

type Props = {
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: "send" | "mic";
  className?: string;
};

export default function FAB({ onClick, disabled, ariaLabel = "Aktion", icon = "send", className }: Props) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.06 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      className={clsx(
        "ripple fixed bottom-[max(80px,env(safe-area-inset-bottom))] right-4 z-30",
        "h-14 w-14 rounded-full",
        "border border-white/15",
        "bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary-2))] to-[hsl(var(--accent))]",
        "shadow-[0_8px_24px_rgba(139,92,246,.35)]",
        "text-white grid place-items-center",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      onPointerDown={(e) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--x", `${e.clientX - rect.left}px`);
        target.style.setProperty("--y", `${e.clientY - rect.top}px`);
      }}
    >
      {icon === "send" ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 19v2" />
        </svg>
      )}
    </motion.button>
  );
}
