import { useEffect, useMemo, useState, useContext, useRef } from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { SettingsContext } from "../../widgets/shell/AppShell";
import { PersonaContext } from "../../entities/persona";
import { useSettings } from "../../entities/settings/store";

type Bubble = ChatMessage & { id: string; ts: number };

function uuid(): string {
  if ((globalThis as any)?.crypto?.randomUUID) return (globalThis as any).crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** sehr einfacher Markdown-Renderer: fenced code, Links, strong/em */
function renderMarkdown(text: string): JSX.Element {
  const parts: Array<{type: "code"|"text"; content: string}> = [];
  const fence = /```([\s\S]*?)```/g;
  let lastIndex = 0; let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ type:"text", content: text.slice(lastIndex, m.index) });
    parts.push({ type:"code", content: m[1] ?? "" });
    lastIndex = fence.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type:"text", content: text.slice(lastIndex) });

  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const strongRe = /\*\*([^*]+)\*\*/g;
  const emRe = /\*([^*]+)\*/g;

  return (
    <>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <pre key={`c${i}`}><code>{p.content}</code></pre>
        ) : (
          <p key={`t${i}`}>
            {p.content.split("\n").map((line, li) => {
              const nodes: (string|JSX.Element)[] = [];
              let idx = 0, match: RegExpExecArray|null;

              // Links
              let tmp = ""; let last = 0;
              while ((match = linkRe.exec(line)) !== null) {
                if (match.index > last) tmp += line.slice(last, match.index);
                nodes.push(tmp);
                nodes.push(<a key={`l${i}-${li}-${idx++}`} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a>);
                tmp = ""; last = linkRe.lastIndex;
              }
              tmp += line.slice(last);

              // Strong / Emphasis rudimentär (auf tmp)
              const applyInline = (s: string) =>
                s
                  .replace(strongRe, (_, g1) => `§§STR§§${g1}§§ENDSTR§§`)
                  .replace(emRe, (_, g1) => `§§EM§§${g1}§§ENDEM§§`)
                  .split(/(§§STR§§|§§ENDSTR§§|§§EM§§|§§ENDEM§§)/);

              const toks = applyInline(tmp);
              let bold = false, em = false, buf: any[] = [];
              for (const t of toks) {
                if (t === "§§STR§§") { bold = true; continue; }
                if (t === "§§ENDSTR§§") { bold = false; continue; }
                if (t === "§§EM§§") { em = true; continue; }
                if (t === "§§ENDEM§§") { em = false; continue; }
                let node: any = t;
                if (bold) node = <strong key={`b${i}-${li}-${idx++}`}>{node}</strong>;
                if (em) node = <em key={`e${i}-${li}-${idx++}`}>{node}</em>;
                buf.push(node);
              }
              nodes.push(...buf);

              return <span key={`ln${li}`}>{nodes}{li < (p.content.split("\n").length-1) ? <br/> : null}</span>;
            })}
          </p>
        )
      )}
    </>
  );
}

type Props = { client: OpenRouterClient };

export default function ChatPanel({ client }: Props) {
  const [items, setItems] = useState<Bubble[]>(() => {
    try {
      const raw = localStorage.getItem("chat_items");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const openSettings = useContext(SettingsContext);
  const settings = useSettings();
  const personaCtx = useContext(PersonaContext);
  const style = personaCtx?.data.styles.find(p => p.id === settings.personaId);
  const systemMsg = useMemo<ChatMessage | null>(() => style ? { role: "system", content: style.system } : null, [style]);

  const disabledReason = useMemo(() => {
    const apiKey = client.getApiKey();
    if (!apiKey) return "Kein API-Key gesetzt";
    if (!settings.modelId) return "Kein Modell gewählt";
    return "";
  }, [settings.modelId]);

  useEffect(() => {
    try { localStorage.setItem("chat_items", JSON.stringify(items)); } catch {}
  }, [items]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 9999;
  }, [items, busy]);

  function last200<T>(arr: T[]): T[] { return arr.length > 200 ? arr.slice(-200) : arr; }

  async function send() {
    if (busy || !input.trim()) return;
    if (disabledReason) { openSettings(); return; }

    const trimmed = input.trim();
    const userMsg: Bubble = { id: uuid(), role: "user", content: trimmed, ts: Date.now() };

    const historySnapshot = items;
    setInput("");
    setItems(prev => [...prev, userMsg]);
    setBusy(true);

    const controller = new AbortController();
    const signal = controller.signal;
    setAbortCtrl(controller);
    try {
      const historyMsgs = historySnapshot.map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const baseMsgs = systemMsg ? [systemMsg, ...historyMsgs] : historyMsgs;

      const body = {
        model: settings.modelId!,
        messages: [...baseMsgs, { role: "user", content: userMsg.content }],
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      };

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${client.getApiKey()}`
        },
        body: JSON.stringify(body),
        signal
      });

      if (!res.ok) {
        let msg = `OpenRouter Fehler ${res.status}`;
        try { const data = await res.json(); msg = data?.error?.message || msg; } catch {}
        throw new Error(msg);
      }

      const newId = uuid();
      const newBubble: Bubble = { id: newId, role: "assistant", content: "", ts: Date.now() };
      setItems(prev => [...prev, newBubble]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) { done = true; break; }
        buffer += decoder.decode(value, { stream: true });

        let lineEnd: number;
        while ((lineEnd = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (!line) continue;
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") { done = true; break; }
            try {
              const dataObj = JSON.parse(data);
              const delta = dataObj.choices?.[0]?.delta;
              if (delta && delta.content) {
                setItems(prevItems => prevItems.map(msg => msg.id === newId ? { ...msg, content: msg.content + delta.content } : msg));
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const errMsg: Bubble = { id: uuid(), role: "assistant", content: `❌ ${e?.message ?? e}`, ts: Date.now() };
        setItems(prev => [...prev, errMsg]);
      }
    } finally {
      setBusy(false);
      setAbortCtrl(null);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }

  function stop() { if (abortCtrl) abortCtrl.abort(); }

  function copyToClipboard(text: string) {
    if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(() => {}); return; }
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  }

  function shareContent(text: string) {
    if ((navigator as any).share) { (navigator as any).share({ text }).catch(() => {}); }
    else { copyToClipboard(text); }
  }

  async function regenerate(assistantId: string) {
    const idx = items.findIndex(x => x.id === assistantId);
    if (idx < 1 || idx !== items.length - 1) return; // nur letzte KI-Antwort
    const userMsg = items[idx - 1];
    if (!userMsg || userMsg.role !== "user") return; // Guard gegen TS-Fehler

    const newId = uuid();
    const controller = new AbortController();
    setBusy(true);
    setAbortCtrl(controller);
    setItems(prev => [...prev.slice(0, -1), { id: newId, role: "assistant", content: "", ts: Date.now() }]);

    try {
      const historyMsgs = items.slice(0, idx).map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const baseMsgs = systemMsg ? [systemMsg, ...historyMsgs] : historyMsgs;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${client.getApiKey()}`
        },
        body: JSON.stringify({ model: settings.modelId!, messages: baseMsgs, temperature: 0.7, max_tokens: 1024, stream: true }),
        signal: controller.signal
      });

      if (!res.ok) {
        let msg = `OpenRouter Fehler ${res.status}`;
        try { const data = await res.json(); msg = data?.error?.message || msg; } catch {}
        throw new Error(msg);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) { done = true; break; }
        buffer += decoder.decode(value, { stream: true });

        let lineEnd: number;
        while ((lineEnd = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (!line) continue;
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") { done = true; break; }
            try {
              const dataObj = JSON.parse(data);
              const delta = dataObj.choices?.[0]?.delta;
              if (delta && delta.content) {
                setItems(prevItems => prevItems.map(msg => msg.id === newId ? { ...msg, content: msg.content + delta.content } : msg));
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const errMsg: Bubble = { id: uuid(), role: "assistant", content: `❌ ${e?.message ?? e}`, ts: Date.now() };
        setItems(prev => [...prev, errMsg]);
      }
    } finally {
      setBusy(false);
      setAbortCtrl(null);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }

  const renderItems = last200(items.filter(m => m.role !== "system"));

  function dayLabel(ts: number): string {
    const d = new Date(ts); const today = new Date(); const yday = new Date(); yday.setDate(today.getDate()-1);
    const fmt = (x: Date) => x.toISOString().slice(0,10);
    if (fmt(d) === fmt(today)) return "Heute";
    if (fmt(d) === fmt(yday)) return "Gestern";
    return d.toLocaleDateString();
  }

  const dayMarks: string[] = [];
  function needDivider(ts: number): boolean {
    const lbl = dayLabel(ts);
    if (dayMarks.includes(lbl)) return false;
    dayMarks.push(lbl);
    return true;
  }

  return (
    <div className="chat-root">
      {disabledReason && (
        <div className="notice">
          <span>{disabledReason}</span>
          <button className="btn" onClick={openSettings}>Einstellungen</button>
        </div>
      )}

      <div className="chat-list" ref={listRef} aria-live="polite" aria-label="Chat-Verlauf">
        {renderItems.map((item) => (
          <div key={item.id}>
            {needDivider(item.ts) && <div className="day-divider"><span>{dayLabel(item.ts)}</span></div>}
            <div className={`bubble ${item.role === "user" ? "bubble--user" : "bubble--bot"}`}>
              <div className="bubble__txt">{renderMarkdown(item.content)}</div>
              <div className={`bubble__meta ${item.role === "user" ? "meta--r" : "meta--l"}`}>
                {new Date(item.ts).toLocaleTimeString()}
              </div>
              {item.role === "assistant" && (
                <div className="bubble__toolbar">
                  <button className="m-icon-btn" onClick={() => navigator.clipboard?.writeText(item.content).catch(()=>{})} aria-label="Kopieren">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H3v10h2V5h4V3zm4 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 10H5V7h6v8z" fill="currentColor"/></svg>
                  </button>
                  <button className="m-icon-btn" onClick={() => ((navigator as any).share ? (navigator as any).share({ text: item.content }).catch(()=>{}) : navigator.clipboard?.writeText(item.content))} aria-label="Teilen">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.414l-8.293 8.293-1.414-1.414L17.586 5H14V3z M5 5h5V3H5C3.9 3 3 3.9 3 5v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5h-2v5H5V5z" fill="currentColor"/></svg>
                  </button>
                  <button className="m-icon-btn" onClick={() => regenerate(item.id)} aria-label="Regenerieren">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v5h2V6.414l3.293 3.293 1.414-1.414L7.414 5H10V3H4zm16 16v-5h-2v2.586l-3.293-3.293-1.414 1.414L16.586 19H14v2h6z" fill="currentColor"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="bubble bubble--bot">
            <div className="bubble__dots"><span className="dot"/><span className="dot"/><span className="dot"/></div>
          </div>
        )}
      </div>

      <div className="composer" role="group" aria-label="Nachricht schreiben">
        <textarea
          ref={taRef}
          rows={1}
          className="composer__input"
          placeholder="Nachricht schreiben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={!!disabledReason || busy}
          inputMode="text"
        />
        <button className="btn btn--send" onClick={busy ? stop : send} disabled={!!disabledReason || (busy && !abortCtrl) || (!busy && !input.trim())} aria-label={busy ? "Stop" : "Senden"}>
          {busy ? (
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21l21-9L2 3l5 8-5 10z" fill="currentColor"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}
