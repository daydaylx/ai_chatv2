export type OpenRouterChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
};

const LS_MODELS_KEY = "openrouter_model_list_v1";

export class OpenRouterClient {
  private apiKey: string | null;

  /** apiKey optional halten, damit alter Code new OpenRouterClient() weiter funktioniert */
  constructor(apiKey: string | null = null) {
    this.apiKey = apiKey;
  }

  setApiKey(k: string | null) {
    this.apiKey = (k || "").trim() || null;
  }

  /** für alten Code in src/lib/client.tsx */
  getApiKey(): string | null {
    return this.apiKey;
  }

  async *streamChat(opts: {
    model: string;
    messages: OpenRouterChatMessage[];
    temperature?: number;
    max_tokens?: number;
    signal?: AbortSignal;
  }): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) throw new Error("NO_API_KEY");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.max_tokens ?? null,
        stream: true
      }),
      signal: opts.signal
    });
    if (res.status === 401) throw new Error("AUTH");
    if (res.status === 429) throw new Error("RATE");
    if (!res.ok || !res.body) throw new Error("HTTP_" + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const j = JSON.parse(payload);
            const delta = j?.choices?.[0]?.delta?.content ?? "";
            if (delta) yield String(delta);
          } catch {
            // unlesbarer Chunk -> ignorieren
          }
        }
      }
    }
  }

  /** Live-Liste der unter deinem Key verfügbaren Modelle */
  async listModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) return [];
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Authorization": `Bearer ${this.apiKey}` }
      });
      if (!res.ok) return [];
      const j = await res.json();
      const arr = Array.isArray(j?.data) ? j.data : [];
      return arr.map((m: any) => ({
        id: String(m.id),
        name: typeof m?.name === "string" ? m.name : String(m?.id ?? ""),
        context_length: Number(m?.context_length || 0)
      }));
    } catch {
      return [];
    }
  }

  /**
   * Gecachte Modellliste. TTL in Millisekunden (Default 5min).
   * Kompatibel zu altem Code: client.listModelsCached(5 * 60 * 1000)
   */
  async listModelsCached(ttlMs: number = 5 * 60 * 1000): Promise<OpenRouterModel[]> {
    try {
      const raw = localStorage.getItem(LS_MODELS_KEY);
      if (raw) {
        const { ts, items } = JSON.parse(raw) as { ts: number; items: OpenRouterModel[] };
        if (Array.isArray(items) && typeof ts === "number" && Date.now() - ts < ttlMs) {
          return items;
        }
      }
    } catch {
      // ignore cache read errors
    }

    const items = await this.listModels();

    try {
      localStorage.setItem(LS_MODELS_KEY, JSON.stringify({ ts: Date.now(), items }));
    } catch {
      // ignore cache write errors
    }

    return items;
  }
}
