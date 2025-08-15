import { clsx } from "clsx";
/** Minimaler cn()-Helper */
export function cn(...inputs: any[]) {
  return clsx(inputs.filter(Boolean));
}
