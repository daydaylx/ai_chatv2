import { clsx, type ClassValue } from "clsx";

/**
 * Minimale cn-Hilfsfunktion.
 * Falls du tailwind-merge später nutzen willst, kannst du es hier ergänzen.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}
