import * as React from "react";

export default function ChatPanel() {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const stickRef = React.useRef(true);

  const onScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
  }, []);

  const [items, setItems] = React.useState<Array<{ id: string; role: "user" | "assistant"; text: string }>>([
    { id: "u1", role: "user",      text: "Hallo, starte bitte eine neue Session." },
    { id: "a1", role: "assistant", text: "Klar – wie kann ich helfen?" },
  ]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [items]);

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-auto p-3 space-y-2 rounded-xl bg-white/[0.03] border border-white/10">
      {items.map((m) => (
        <div key={m.id} className={["max-w-[85%] px-3 py-2 rounded-lg", m.role === "user" ? "ml-auto bg-[hsl(var(--accent-600))] text-black" : "mr-auto bg-white/[0.08] text-white"].join(" ")}>
          <div className="whitespace-pre-wrap text-[15px] leading-normal">{m.text}</div>
        </div>
      ))}
    </div>
  );
}
