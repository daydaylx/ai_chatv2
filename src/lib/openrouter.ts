export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

type HeadersMap = Record<string, string>;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export class OpenRouterClient {
  private key: string;
  private timeoutMs: number;
  private maxRetries: number;

  static API = "https://openrouter.ai/api/v1";

  constructor(apiKey: string, opts?: { timeoutMs?: number; maxRetries?: number }) {
    if (!apiKey) throw new Error("OpenRouter API-Key fehlt.");
    this.key = apiKey;
    this.timeoutMs = opts?.timeoutMs ?? 30000;
    this.maxRetries = Math.max(0, opts?.maxRetries ?? 2);
  }

  private baseHeaders(extra?: HeadersMap): HeadersMap {
    const base: HeadersMap = {
      "Authorization": `Bearer ${this.key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
      "X-Title": "AI Chat PWA"
    };
    return { ...base, ...(extra ?? {}) };
  }

  async listModels(): Promise<any[]> {
    const res = await fetch(`${OpenRouterClient.API}/models`, { headers: this.baseHeaders() });
    if (!res.ok) throw new Error(`Model-List fehlgeschlagen (${res.status})`);
    const j = await res.json();
    return Array.isArray(j?.data) ? j.data : [];
  }

  async chatOnce(req: ChatRequest): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), this.timeoutMs);
        const res = await fetch(`${OpenRouterClient.API}/chat/completions`, {
          method: "POST",
          headers: this.baseHeaders(),
          body: JSON.stringify({ ...req, stream: false }),
          signal: ctrl.signal
        });
        clearTimeout(to);
        if (!res.ok) throw await this.asApiError(res);
        const j = await res.json();
        const txt =
          j?.choices?.[0]?.message?.content ??
          j?.choices?.[0]?.delta?.content ??
          "";
        return String(txt);
      } catch (e) {
        lastErr = e;
        if (!this.isRetryable(e, attempt)) break;
        await sleep(300 * (attempt + 1));
      }
    }
    throw lastErr ?? new Error("chatOnce fehlgeschlagen");
  }

  async *chatStream(req: ChatRequest, abort?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    if (abort) abort.addEventListener("abort", onAbort);

    try {
      const response = await fetch(`${OpenRouterClient.API}/chat/completions`, {
        method: "POST",
        headers: this.baseHeaders(),
        body: JSON.stringify({ ...req, stream: true }),
        signal: ctrl.signal
      });
      if (!response.ok || !response.body) {
        const text = await this.chatOnce({ ...req, stream: false });
        if (text) yield text;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          for (const line of chunk.split("\n")) {
            const l = line.trim();
            if (!l.startsWith("data:")) continue;
            const payload = l.slice(5).trim();
            if (payload === "[DONE]") return;
            if (!payload || payload === "{}") continue;
            try {
              const json = JSON.parse(payload);
              const delta =
                json?.choices?.[0]?.delta?.content ??
                json?.choices?.[0]?.message?.content ??
                "";
              if (delta) yield String(delta);
            } catch {
              // JSON-Fragment ignorieren
            }
          }
        }
      }
    } catch (e) {
      if (this.isRetryable(e, 0)) {
        const text = await this.chatOnce({ ...req, stream: false });
        if (text) yield text;
        return;
      }
      throw e;
    } finally {
      if (abort) abort.removeEventListener("abort", onAbort);
    }
  }

  private async asApiError(res: Response): Promise<Error> {
    try {
      const j = await res.json();
      const msg = j?.error?.message || `HTTP ${res.status}`;
      return new Error(msg);
    } catch {
      return new Error(`HTTP ${res.status}`);
    }
  }

  private isRetryable(e: unknown, attempt: number): boolean {
    const msg = String((e as any)?.message || e || "");
    if (/abort/i.test(msg)) return false;
    if (attempt >= this.maxRetries) return false;
    return /(NetworkError|Failed to fetch|timeout|HTTP 5\d\d|HTTP 429)/i.test(msg);
  }
}
