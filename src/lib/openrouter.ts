/**
 * Robuster OpenRouter-Client mit JSON-Delta-Streaming.
 * Zusätzlich: Kompatibilitätsexporte `OpenRouterClient` und `sendChat`,
 * weil andere Module diese erwarten.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type StreamCallbacks = {
  onToken?: (t: string) => void;
  onError?: (msg: string) => void;
  onDone?: () => void;
};

export type SendOptions = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
};

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Niedrigstufige API: Stream direkt starten.
 * Nutzt SSE ("data: ...") und extrahiert content aus common Feldern.
 */
export async function streamChat(opts: SendOptions, cbs: StreamCallbacks = {}) {
  const { apiKey, model, messages, temperature = 0.7, signal, timeoutMs = 60000 } = opts;

  if (!apiKey) {
    cbs.onError?.("Kein API-Schlüssel gesetzt.");
    return;
  }

  let res: Response;
  try {
    res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": location.origin,
        "X-Title": "ai_chatv2",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true,
      }),
      signal,
    }, timeoutMs);
  } catch (e: any) {
    if (e?.name === "AbortError") {
      cbs.onError?.("Abgebrochen.");
      return;
    }
    cbs.onError?.("Netzwerkfehler. Prüfe Verbindung.");
    return;
  }

  if (!res.ok || !res.body) {
    const status = res.status;
    const text = await res.text().catch(() => "");
    if (status === 429) cbs.onError?.("Rate-Limit erreicht (429). Bitte kurz warten und erneut versuchen.");
    else if (status >= 500) cbs.onError?.("OpenRouter antwortet nicht stabil (5xx). Später erneut versuchen.");
    else cbs.onError?.(`Fehler ${status}: ${text || "Unbekannter Fehler"}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE-Events sind durch \n\n getrennt
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);

        if (!chunk.startsWith("data:")) continue;
        const data = chunk.slice(5).trim();
        if (data === "[DONE]") {
          cbs.onDone?.();
          return;
        }
        try {
          const json = JSON.parse(data);
          const piece =
            json?.choices?.[0]?.delta?.content ??
            json?.choices?.[0]?.message?.content ??
            json?.content ??
            "";
          if (piece) cbs.onToken?.(piece);
        } catch {
          if (data && data !== "null") cbs.onToken?.(String(data));
        }
      }
    }
  } catch (e: any) {
    if (e?.name === "AbortError") cbs.onError?.("Abgebrochen.");
    else cbs.onError?.("Stream abgebrochen. Verbindung instabil?");
  } finally {
    cbs.onDone?.();
  }
}

/* ------------------------------------------------------------------ */
/* Kompatibilitätsschicht                                             */
/* ------------------------------------------------------------------ */

/**
 * Historische High-Level-Funktion, die von `lib/client.tsx` importiert wird.
 * Delegiert auf streamChat; akzeptiert eine Optionsstruktur mit Callbacks.
 */
export async function sendChat(args: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
  onToken?: (t: string) => void;
  onError?: (m: string) => void;
  onDone?: () => void;
}) {
  const {
    apiKey, model, messages, temperature, signal, timeoutMs,
    onToken, onError, onDone,
  } = args;

  return streamChat(
    { apiKey, model, messages, temperature, signal, timeoutMs },
    { onToken, onError, onDone }
  );
}

/**
 * Historische Klassen-API, die z. B. von `lib/catalog.ts` importiert wird.
 * Bietet `send()` und nutzt intern streamChat.
 */
export class OpenRouterClient {
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(args: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    signal?: AbortSignal;
    timeoutMs?: number;
    onToken?: (t: string) => void;
    onError?: (m: string) => void;
    onDone?: () => void;
  }) {
    const { model, messages, temperature, signal, timeoutMs, onToken, onError, onDone } = args;
    return streamChat(
      { apiKey: this.apiKey, model, messages, temperature, signal, timeoutMs },
      { onToken, onError, onDone }
    );
  }
}
