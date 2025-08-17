import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { OpenRouterClient, type ChatMessage } from "../../lib/openrouter";
import { useSettings } from "../../entities/settings/store";
import { PersonaContext } from "../../entities/persona";
import { SettingsContext } from "../../widgets/shell/AppShell";

type Bubble = ChatMessage & { id: string; ts: number };
function uuid(): string { return (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

const BUILD_TAG = "chatpanel-guard-v2";

export default function ChatPanel({ client }: { client: OpenRouterClient }) {
  const [items, setItems] = useState<Bubble[]>(() => { try { return JSON.parse(localStorage.getItem("chat_items")||"[]"); } catch { return []; }});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);

  // Verfügbare Provider-Modelle
  const [remoteIds, setRemoteIds] = useState<Set<string>>(new Set());
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const listRef = useRef<HTMLDivElement|null>(null);
  const taRef = useRef<HTMLTextAreaElement|null>(null);

  const openSettings = useContext(SettingsContext);
  const settings = useSettings();
  const persona = useContext(PersonaContext);

  // aktuellen Stil herausziehen
  const style = useMemo(() => persona.data.styles.find(x => x.id === settings.personaId) ?? persona.data.styles[0] ?? null, [persona.data.styles, settings.personaId]);
  const systemMsg = useMemo<ChatMessage | null>(() => style ? { role: "system", content: style.system } : null, [style]);

  useEffect(() => { try { localStorage.setItem("chat_items", JSON.stringify(items)); } catch {} }, [items]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight + 9999; }, [items, busy]);

  // Liste verfügbarer Modelle vom Provider cachen (5 Minuten)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await client.listModelsCached(5 * 60 * 1000);
        if (!alive) return;
        setRemoteIds(new Set(list.map(m => m.id)));
      } finally {
        if (alive) setRemoteLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [client]);

  const apiKeySet = !!client.getApiKey();

  // Gründe, warum Senden deaktiviert ist
  const disabledReason = useMemo(() => {
    if (!apiKeySet) return "Kein API-Key gesetzt";
    if (!settings.modelId) return "Kein Modell gewählt";
    // Wenn Liste da und nicht leer, Modell muss gelistet sein
    if (remoteLoaded && remoteIds.size > 0 && !remoteIds.has(settings.modelId)) {
      return `Gewähltes Modell ist bei OpenRouter nicht verfügbar`;
    }
    return "";
  }, [apiKeySet, settings.modelId, remoteLoaded, remoteIds]);

  function last200<T>(arr: T[]): T[] { return arr.length > 200 ? arr.slice(-200) : arr; }

  function pushSystem(msg: string) {
    setItems(prev => [...prev, { id: uuid(), role: "assistant", content: `❌ ${msg}`, ts: Date.now() }]);
  }

  async function send() {
    if (busy || !input.trim()) return;

    // NEU: Wenn Key vorhanden, aber Modellsicht noch nicht geladen → erst gar nicht versuchen.
    if (apiKeySet && !remoteLoaded) {
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
      const messages: ChatMessage[] = systemMsg ? [systemMsg, ...historyMsgs, { role: "user", content: userMsg.content }] : [...historyMsgs, { role: "user", content: userMsg.content }];

      const reqBody = { model: settings.modelId!, messages, temperature: 0.7, max_tokens: 1024, stream: true };
      const id = uuid();
      setItems(prev => [...prev, { id, role: "assistant", content: "", ts: Date.now() }]);

      await client.chatStream(reqBody, controller.signal, (delta) => {
        setItems(prev => prev.map(b => b.id === id ? { ...b, content: b.content + delta } : b));
      });
    } catch (e: any) {
      const msg = String(e?.message || e || "Fehler");
      if (/No endpoints found for/i.test(msg)) {
        pushSystem("Modell nicht verfügbar beim Anbieter. Bitte ein anderes Modell wählen.");
        openSettings();
      } else {
        pushSystem(msg);
      }
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

    if (apiKeySet && !remoteLoaded) {
      pushSystem("Prüfe Modellverfügbarkeit … bitte kurz warten und dann erneut generieren.");
      return;
    }
    if (disabledReason) {
      pushSystem(disabledReason + " – wähle ein gelistetes Modell in den Einstellungen.");
      openSettings();
      return;
    }

    const controller = new AbortController();
    setBusy(true);
    setAbortCtrl(controller);
    const newId = uuid();
    setItems(prev => [...prev.slice(0, -1), { id: newId, role: "assistant", content: "", ts: Date.now() }]);

    try {
      const historyMsgs = items.slice(0, idx).map(({ role, content }) => ({ role, content })) as ChatMessage[];
      const messages: ChatMessage[] = systemMsg ? [systemMsg, ...historyMsgs] : historyMsgs;
      const reqBody = { model: settings.modelId!, messages, temperature: 0.7, max_tokens: 1024, stream: true };

      await client.chatStream(reqBody, controller.signal, (delta) => {
        setItems(prev => prev.map(b => b.id === newId ? { ...b, content: b.content + delta } : b));
      });
    } catch (e: any) {
      const msg = String(e?.message || e || "Fehler");
      if (/No endpoints found for/i.test(msg)) {
        pushSystem("Modell nicht verfügbar beim Anbieter. Bitte ein anderes Modell wählen.");
        openSettings();
      } else {
        pushSystem(msg);
      }
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
      {/* Build-Tag in der Konsole hilft, SW-Stale zu erkennen */}
      {useEffect(() => { try { console.debug(BUILD_TAG); } catch {} }, []) as unknown as null}

      {(apiKeySet && !remoteLoaded) && (
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
            disabled={busy || (apiKeySet && !remoteLoaded)}
          />
          <button className="btn btn--solid" onClick={busy ? stop : send} disabled={(apiKeySet && !remoteLoaded) || (!busy && !input.trim())} aria-label={busy ? "Stop" : "Senden"}>
            {busy ? "Stop" : "Senden"}
          </button>
        </div>
      </div>
    </div>
  );
}
