import { useState } from "react";

export default function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      if ("vibrate" in navigator) (navigator as any).vibrate?.(15);
    } catch {}
  }

  return (
    <pre className="code">
      <button className="code-copy" onClick={copy}>{copied ? "Kopiert" : "Copy"}</button>
      <code className="block whitespace-pre">{code}</code>
    </pre>
  );
}

/** Dumb parser: splittet ```lang ... ``` in Segmente */
export function parseMessageToSegments(text: string): Array<{ type: "text" | "code"; value: string; lang?: string }> {
  const rx = /```(\w+)?\n([\s\S]*?)```/g;
  const segs: Array<{ type: "text" | "code"; value: string; lang?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text))) {
    if (m.index > last) segs.push({ type: "text", value: text.slice(last, m.index) });
    segs.push({ type: "code", value: m[2], lang: m[1] || undefined });
    last = rx.lastIndex;
  }
  if (last < text.length) segs.push({ type: "text", value: text.slice(last) });
  return segs.length ? segs : [{ type: "text", value: text }];
}
