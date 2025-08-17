import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../../lib/openrouter";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { SettingsContext } from "../../widgets/shell/AppShell";
import { useClient } from "../../lib/client";
import { loadChat, saveChat } from "../../lib/db";

type Bubble = ChatMessage & { id: string; ts: number };
function uuid(): string { return (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function ChatPanel() {
  const [items, setItems] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);

  const listRef = useRef<HTMLDivElement|null>(null);
  const taRef = useRef<HTMLTextAreaElement|null>(null);

  const openSettings = useContext(SettingsContext);
  const settings = useSettings();
  const persona = useContext(PersonaContext);
  const { client, apiKey, remoteIds, remoteLoaded, getContextFor } = useClient();

  // Laden/Speichern via IndexedDB (mit Fallback)
  useEffect(() => { (async () => setItems(await loadChat()))(); }, []);
  useEffect(() => { void saveChat(items); }, [items]);

  const style = useMemo(
    () => persona.data.styles.find(x => x.id === settings.personaId) ?? persona.data.styles[0] ?? null,
    [persona.data.styles, settings.personaId]
  );
  const systemMsg = useMemo<ChatMessage | null>(
    () => style ? { role: "system", content: style.system } : null,
    [style]
  );

  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight + 9999; }, [items, busy]);

  const disabledReason = useMemo(() => {
    if (!apiKey) return "Kein API-Key gesetzt";
    if (!settings.modelId) return "Kein Modell gewählt";
    if (remoteLoaded && remoteIds.size > 0 && !remoteIds.has(settings.modelId)) {
      return "Gewähltes Modell ist bei OpenRouter nicht verfügbar";
    }
    return "";
  }, [apiKey, settings.modelId, remoteLoaded, remoteIds]);

  function last200<T>(arr: T[]): T[] { return arr.length > 200 ? arr.slice(-200) : arr; }
  function pushSystem(msg: string) { setItems(prev => [...prev, { id: uuid(), role: "assistant", content: `❌ ${msg}`, ts: Date.now() }]); }

  /** einfache Token-Schätzung (≈ 3.6 Zeichen pro Token) */
  function estimateTokens(text: string): number {
    return Math.ceil((text ?? "").length / 3.6);
  }

  /**
   * Kontext-Zusammenstellung:
   * - Ziel: so viel Historie wie möglich, aber unterhalb der Kontextlänge
   * - Reserve: 1024 Tokens für die Modell-Antwort
   * - Wenn unbekannt: 8192 tokens annehmen
   */
  function buildContext(history: ChatMessage[], userContent: string, modelId: string): ChatMessage[] {
    const ctxTokens = Math.max(2048, getContextFor(modelId, 8192)); // großzügig
    const reserveOut = 1024;
    const budget = Math.max(1024, ctxTokens - reserveOut);

    const messages: ChatMessage[] = [];
    if (systemMsg) messages.push(systemMsg);

    const tail: ChatMessage[] = [...history, { role: "user", content: userContent }];

    // Von hinten auffüllen bis Budget erreicht (ohne Index-Zugriff → kein undefined)
    let used = estimateTokens(messages.map(m => m.content).join("\n"));
    const collected: ChatMessage[] = [];
    for (const tMsg of [...tail].reverse()) {
      const t = estimateTokens(tMsg.content);
      if (used + t > budget) break;
      collected.push(tMsg);
      used += t;
    }
    collected.reverse();
    return messages.concat(collected);
  }

  async function send() {
    if (busy || !input.trim()) return;

    if (apiKey && !remoteLoaded) {
      pushSystem("Prüfe Modellverfügbarkeit … bitte kurz warten und erneut senden.");
      return;
    }
    if (disabledReason) {
      pushSystem(disabledReason + " – wähle ein gelistetes Modell in den Einstellungen.");
      openSettings();
      return;
    }

    const userMsg: Bubble = { id: uuid(), role: "user", content: input.trim(), ts: Date.now() };
    setInput("");
    setItems(prev => [...prev, userMsg]);
    setBusy(true);

    const controller = new AbortController();
    setAbortCtrl(controller);

    try {
      const historyMsgs = items.map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const messages = buildContext(historyMsgs, userMsg.content, settings.modelId!);

      const reqBody = { model: settings.modelId!, messages, temperature: 0.7, max_tokens: 1024, stream: true };

      const id = uuid();
      setItems(prev => [...prev, { id, role: "assistant", content: "", ts: Date.now() }]);

      await client.chatStream(reqBody, controller.signal, (delta) => {
        setItems(prev => prev.map(b => b.id === id ? { ...b, content: b.content + delta } : b));
      });
    } catch (e: any) {
      const msg = String(e?.message || e || "Fehler");
      pushSystem(msg);
    } finally {
      setBusy(false);
      setAbortCtrl(null);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }

  function stop() { abortCtrl?.abort(); }

  async function regenerate(assistantId: string) {
    const idx = items.findIndex(x => x.id === assistantId);
    if (idx < 1 || idx !== items.length - 1) return;
    const userMsg = items[idx - 1];
    if (!userMsg || userMsg.role !== "user") return;

    if (apiKey && !remoteLoaded) { pushSystem("Prüfe Modellverfügbarkeit … kurz warten und erneut generieren."); return; }
    if (disabledReason) { pushSystem(disabledReason + " – anderes Modell wählen."); openSettings(); return; }

    const controller = new AbortController();
    setBusy(true);
    setAbortCtrl(controller);
    const newId = uuid();
    setItems(prev => [...prev.slice(0, -1), { id: newId, role: "assistant", content: "", ts: Date.now() }]);

    try {
      const historyMsgs = items.slice(0, idx).map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const messages = buildContext(historyMsgs, userMsg.content, settings.modelId!);
      const reqBody = { model: settings.modelId!, messages, temperature: 0.7, max_tokens: 1024, stream: true };

      await client.chatStream(reqBody, controller.signal, (delta) => {
        setItems(prev => prev.map(b => b.id === newId ? { ...b, content: b.content + delta } : b));
      });
    } catch (e: any) {
      const msg = String(e?.message || e || "Fehler");
      pushSystem(msg);
    } finally {
      setBusy(false);
      setAbortCtrl(null);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }

  function dayLabel(ts: number): string {
    const d = new Date(ts); const t = new Date(); const y = new Date(); y.setDate(t.getDate()-1);
    const iso = (x: Date) => x.toISOString().slice(0,10);
    if (iso(d) === iso(t)) return "Heute";
    if (iso(d) === iso(y)) return "Gestern";
    return d.toLocaleDateString();
  }

  const daySeen = new Set<string>();
  const renderItems = last200(items.filter(x => x.role !== "system"));

  return (
    <div className="chat-root">
      {(apiKey && !remoteLoaded) && (
        <div className="m-2 p-3 text-sm bg-white/5 text-white/80 border border-white/10 rounded-xl">
          Prüfe Modellverfügbarkeit …
        </div>
      )}

      {disabledReason && (
        <div className="m-2 p-3 text-sm bg-yellow-500/10 text-yellow-200 border border-yellow-500/30 rounded-xl flex items-center justify-between">
          <span>{disabledReason}</span>
          <button className="btn btn--solid" onClick={openSettings}>Einstellungen</button>
        </div>
      )}

      <div ref={listRef} className="chat-list px-3 py-2 space-y-2 overflow-y-auto" style={{height: "calc(100dvh - 8rem)"}}>
        {renderItems.map(it => {
          const lbl = dayLabel(it.ts);
          const needDivider = !daySeen.has(lbl); if (needDivider) daySeen.add(lbl);
          return (
            <div key={it.id}>
              {needDivider && <div className="my-3 text-center text-xs text-white/50">{lbl}</div>}
              <div className={`max-w-[85%] ${it.role==="user" ? "ml-auto bg-[#D97706] text-black" : "mr-auto bg-white/5 text-white"} rounded-2xl px-3 py-2`}>
                <div className="prose prose-invert whitespace-pre-wrap break-words">{it.content || (it.role==="assistant" && busy ? "…" : "")}</div>
                {it.role === "assistant" && it.content && (
                  <div className="mt-1 flex gap-1 text-xs text-white/60">
                    <button className="m-icon-btn" onClick={() => navigator.clipboard?.writeText(it.content)} aria-label="Kopieren">Kopieren</button>
                    <button className="m-icon-btn" onClick={() => ((navigator as any).share ? (navigator as any).share({ text: it.content }) : navigator.clipboard?.writeText(it.content))} aria-label="Teilen">Teilen</button>
                    <button className="m-icon-btn" onClick={() => regenerate(it.id)} aria-label="Regenerieren">Regenerieren</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {busy && <div className="mr-auto bg-white/5 text-white rounded-2xl px-3 py-2">…</div>}
      </div>

      <div className="composer sticky bottom-0 inset-x-0 p-2 bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            ref={taRef}
            rows={1}
            className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#D97706]"
            placeholder="Nachricht schreiben… (Enter=Send, Shift+Enter=Zeile)"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }}
            disabled={busy || (!!apiKey && !remoteLoaded)}
          />
          <button className="btn btn--solid" onClick={busy ? stop : send} disabled={(!!apiKey && !remoteLoaded) || (!busy && !input.trim())} aria-label={busy ? "Stop" : "Senden"}>
            {busy ? "Stop" : "Senden"}
          </button>
        </div>
      </div>
    </div>
  );
}
