import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-Klassen stabil zusammenführen (Konflikte deduplizieren). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
