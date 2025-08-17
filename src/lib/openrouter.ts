export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Modell-Typ laut OpenRouter /models */
export type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  owned_by?: string;
};

const KEY_STORAGE = "openrouter_api_key";

/**
 * Minimaler OpenRouter-Client:
 * - API-Key Verwaltung (localStorage + .env)
 * - Streaming Chat (SSE)
 * - Model-Liste (optional; leer bei Fehlern)
 */
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
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
      const res = await fetch("https://openrouter.ai/api/v1/models", { headers });
      if (!res.ok) return [];
      const json = await res.json();
      // API kann { data: [...] } oder { models: [...] } o.ä. liefern – robust extrahieren
      const list = Array.isArray(json?.data) ? json.data
                : Array.isArray(json?.models) ? json.models
                : Array.isArray(json) ? json
                : [];
      return list.filter(Boolean);
    } catch {
      return [];
    }
  }

  async chatStream(
    body: any,
    signal: AbortSignal,
    onDelta: (chunk: string) => void
  ) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      let msg = `OpenRouter Fehler ${res.status}`;
      try { const data = await res.json(); msg = data?.error?.message || msg; } catch {}
      throw new Error(msg);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          try {
            const obj = JSON.parse(data);
            const delta = obj.choices?.[0]?.delta?.content;
            if (delta) onDelta(delta);
          } catch {}
        }
      }
    }
  }
}
