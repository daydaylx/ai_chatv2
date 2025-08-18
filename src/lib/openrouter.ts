/**
 * OpenRouter-Miniclient:
 * - sendChat(streaming)
 * - listModels() für ModelPicker (kompatible Exporte)
 */
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type SendOptions = {
  apiKey: string;
  model: string;
  messages: ChatMessage[]; // messages[0] MUSS system=persona.system sein (1:1)
  signal?: AbortSignal;
  onToken?: (chunk: string) => void;
  timeoutMs?: number;
};

export type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: unknown;
};

const ORIGIN = "https://openrouter.ai";
const CHAT_ENDPOINT = `${ORIGIN}/api/v1/chat/completions`;
const MODELS_ENDPOINT = `${ORIGIN}/api/v1/models`;

export async function sendChat(opts: SendOptions): Promise<string> {
  const { apiKey, model, messages, onToken, signal, timeoutMs = 45000 } = opts;

  // Dev-Guard mit sauberen Narrowings
  if (import.meta.env?.DEV) {
    const first = messages?.[0];
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn("[guard] messages leer");
    } else if (!first || first.role !== "system") {
      console.warn("[guard] messages[0] ist nicht role=system");
    } else if (typeof first.content !== "string" || !first.content.length) {
      console.warn("[guard] system.content leer");
    }
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const composite = mergeSignals(ctrl.signal, signal);

  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://local.app",
      "X-Title": "ai_chatv2",
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: composite,
  }).catch((e) => {
    clearTimeout(timer);
    throw new Error(`Netzwerkfehler: ${String(e?.message ?? e)}`);
  });

  if (!res.ok) {
    clearTimeout(timer);
    const txt = await safeText(res);
    throw new Error(humanError(res.status, txt));
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let acc = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          // fertig
        } else {
          try {
            const obj = JSON.parse(payload);
            const delta = obj?.choices?.[0]?.delta?.content ?? "";
            if (delta && typeof delta === "string") {
              acc += delta;
              onToken?.(delta);
            }
          } catch {
            // Herzschläge/Teilpakete ignorieren
          }
        }
      }
    }
  } finally {
    clearTimeout(timer);
    try { reader.releaseLock(); } catch {}
  }

  return acc;
}

export class OpenRouterClient {
  // opts optional, apiKey optional → rückwärtskompatibel zu new OpenRouterClient()
  constructor(private opts?: { apiKey?: string }) {}

  async listModels(): Promise<OpenRouterModel[]> {
    const headers: Record<string,string> = { "Content-Type": "application/json" };
    if (this.opts?.apiKey) headers["Authorization"] = `Bearer ${this.opts.apiKey}`;

    const res = await fetch(MODELS_ENDPOINT, { headers });
    if (!res.ok) throw new Error(`Model-List fehlgeschlagen: HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    const list: OpenRouterModel[] = Array.isArray((data as any)?.data) ? (data as any).data : [];
    return list;
  }
}

function mergeSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
  if (!b) return a;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);
  if (a.aborted || b.aborted) ctrl.abort();
  return ctrl.signal;
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return ""; }
}

function humanError(status: number, raw: string): string {
  const msg = raw || "";
  if (status === 401) return "Nicht autorisiert. API-Key prüfen.";
  if (status === 403) return /nsfw|policy/i.test(msg) ? "Inhalt vom Anbieter blockiert." : "Kein Zugriff auf dieses Modell / Plan.";
  if (status === 404) return "Modell oder Endpoint nicht gefunden.";
  if (status === 408) return "Zeitüberschreitung beim Anbieter.";
  if (status === 409) return "Konflikt beim Anbieter. Bitte erneut senden.";
  if (status === 422) return "Request unzulässig/zu groß (422).";
  if (status >= 500) return "Anbieter-Fehler (5xx). Bitte später erneut versuchen.";
  return msg || `HTTP ${status}`;
}
