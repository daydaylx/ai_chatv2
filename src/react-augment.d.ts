import "react";

declare module "react" {
  // Ergänzt fehlendes Attribut in älteren @types/react Versionen
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  }
}
