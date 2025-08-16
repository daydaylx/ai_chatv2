import type { ThemeMode } from "@/types";

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.dataset.theme = "dark";
    root.classList.add("dark");
  } else {
    root.dataset.theme = "light";
    root.classList.remove("dark");
  }
}
