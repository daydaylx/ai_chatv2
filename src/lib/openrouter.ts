/**
 * OpenRouter Low-Level-Client mit:
 * - robustem SSE-Parser (mehrzeilige Events, Heartbeats)
 * - 429-Backoff (Retry-After respektiert, sonst Exponential Backoff)
 * - deutscher Fehlertext-Aufbereitung
 */
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  owned_by?: string;
};

const KEY_STORAGE = "openrouter_api_key";
const MODELS_CACHE_KEY = "openrouter_models_cache_v2";

type ModelsCache = { ts: number; data: OpenRouterModel[] };

export class OpenRouterClient {
  private apiKey: string | null;

  constructor() {
    const fromEnv = (import.meta as any)?.env?.VITE_OPENROUTER_API_KEY || "";
    const fromLS = (typeof localStorage !== "undefined") ? localStorage.getItem(KEY_STORAGE) : null;
    this.apiKey = (fromLS && fromLS.trim()) ? fromLS : (fromEnv?.trim() ? fromEnv : null);
  }

  getApiKey(): string | null { return this.apiKey; }
  setApiKey(key: string) { this.apiKey = key; try { localStorage.setItem(KEY_STORAGE, key); } catch {} }
  clearApiKey() { this.apiKey = null; try { localStorage.removeItem(KEY_STORAGE); } catch {} }

  async listModels(): Promise<OpenRouterModel[]> {
    try {
      const headers: Record<string, string> = { "Accept": "application/json", "X-Title": "AI Chat PWA" };
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
      const res = await fetch("https://openrouter.ai/api/v1/models", { headers });
      if (!res.ok) return [];
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data
                : Array.isArray(json?.models) ? json.models
                : Array.isArray(json) ? json
                : [];
      return list.filter(Boolean);
    } catch {
      return [];
    }
  }

  async listModelsCached(ttlMs = 5 * 60 * 1000): Promise<OpenRouterModel[]> {
    try {
      const raw = localStorage.getItem(MODELS_CACHE_KEY);
      if (raw) {
        const obj = JSON.parse(raw) as ModelsCache;
        if (obj && Array.isArray(obj.data) && Date.now() - obj.ts < ttlMs) return obj.data;
      }
    } catch {}
    const data = await this.listModels();
    try { localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data } as ModelsCache)); } catch {}
    return data;
  }

  /**
   * Streamt Chat-Antworten. Fällt auf Non-Streaming zurück, wenn kein SSE kommt.
   * Backoff bei 429 (max 3 Versuche).
   */
  async chatStream(
    body: any,
    signal: AbortSignal,
    onDelta: (chunk: string) => void
  ) {
    const url = "https://openrouter.ai/api/v1/chat/completions";
    const headers: Record<string,string> = {
      "Accept": "text/event-stream",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
      "X-Title": "AI Chat PWA"
    };

    let attempt = 0;
    while (true) {
      let res: Response;
      try {
        res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal });
      } catch (e: any) {
        if (e?.name === "AbortError") throw e;
        if (attempt++ < 1) { await sleep(1000); continue; } // 1 Retry bei Netzwerkfehlern
        throw new Error("Netzwerkfehler beim Aufruf der API.");
      }

      if (res.status === 429) {
        if (attempt++ >= 3) throw new Error("Rate-Limit erreicht (429). Bitte später erneut versuchen.");
        const ra = parseRetryAfter(res.headers.get("Retry-After"));
        await sleep(ra ?? (1500 * attempt));
        continue;
      }

      if (!res.ok) {
        let msg = `OpenRouter Fehler ${res.status}`;
        try { const data = await res.json(); msg = data?.error?.message || msg; } catch {}
        throw new Error(mapErrorMessage(res.status, msg));
      }

      const ctype = (res.headers.get("Content-Type") || "").toLowerCase();
      if (!ctype.includes("text/event-stream")) {
        // Kein Stream -> JSON einmalig parsen
        try {
          const j = await res.json();
          const text = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.delta?.content || "";
          if (text) onDelta(text);
          return;
        } catch {
          throw new Error("Antwort konnte nicht geparst werden.");
        }
      }

      // Robuster SSE-Parser (Events durch \n\n getrennt, mehrere data:-Zeilen)
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let sep;
        while ((sep = buf.indexOf("\n\n")) !== -1) {
          const eventChunk = buf.slice(0, sep);
          buf = buf.slice(sep + 2);

          const lines = eventChunk.split("\n").map(l => l.trim()).filter(Boolean);
          if (!lines.length) continue;

          const datas: string[] = [];
          for (const line of lines) {
            if (line.startsWith("data:")) datas.push(line.slice(5).trim());
          }
          if (!datas.length) continue;

          for (const d of datas) {
            if (d === "[DONE]") return;
            try {
              const obj = JSON.parse(d);
              const delta = obj?.choices?.[0]?.delta?.content ?? obj?.choices?.[0]?.message?.content ?? "";
              if (delta) onDelta(delta);
            } catch {
              // einzelne defekte Zeile ignorieren
            }
          }
        }
      }

      return; // normaler Abschluss des Streams
    }
  }
}

/** Hilfsfunktionen */

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseRetryAfter(v: string | null): number | null {
  if (!v) return null;
  const s = Number(v);
  if (!Number.isNaN(s)) return s * 1000;
  const t = Date.parse(v);
  if (!Number.isNaN(t)) return Math.max(0, t - Date.now());
  return null;
}

function mapErrorMessage(status: number, raw: string): string {
  const msg = raw || "";
  if (status === 401) return "Nicht autorisiert. API-Key prüfen.";
  if (status === 403) return /nsfw|policy/i.test(msg) ? "Inhalt vom Anbieter blockiert." : "Kein Zugriff auf dieses Modell / Plan.";
  if (status === 404) return "Modell oder Endpoint nicht gefunden.";
  if (status === 408) return "Zeitüberschreitung beim Anbieter.";
  if (status === 409) return "Konflikt beim Anbieter. Bitte erneut senden.";
  if (status === 422) return "Request unzulässig/zu groß (422).";
  if (status >= 500) return "Anbieter-Fehler (5xx). Bitte später erneut versuchen.";
  return msg;
}
