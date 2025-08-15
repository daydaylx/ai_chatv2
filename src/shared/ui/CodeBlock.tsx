import clsx from "clsx";
import { useCallback } from "react";

export type Segment =
  | { type: "text"; value: string }
  | { type: "code"; value: string; lang?: string };

/** Zerlegt Text in Text-/Code-Segmente anhand ```lang ... ``` Blöcken */
export function parseMessageToSegments(input: string): Segment[] {
  const segs: Segment[] = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(input))) {
    const [full, langGroup, codeGroup] = m;
    const before = input.slice(lastIndex, m.index);
    if (before) segs.push({ type: "text", value: before });

    const lang = (langGroup || "").trim() || undefined;
    const code = (codeGroup ?? "").replace(/\n+$/, "");
    segs.push({ type: "code", value: code, lang });

    lastIndex = m.index + full.length;
  }

  const rest = input.slice(lastIndex);
  if (rest) segs.push({ type: "text", value: rest });
  return segs;
}

type Props = {
  code: string;
  lang?: string;
  className?: string;
};

/** Einzelner Codeblock mit Copy-Button (mobile-freundlich) */
export default function CodeBlock({ code, lang, className }: Props) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // still ok; no throw
    }
  }, [code]);

  return (
    <div
      className={clsx(
        "group relative rounded-xl border border-border/60 bg-secondary/50 p-3 backdrop-blur",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {lang ?? "code"}
        </span>
        <button
          onClick={copy}
          className="rounded-lg border border-border/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary/60"
        >
          Kopieren
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-background/60 p-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
