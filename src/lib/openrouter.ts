export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const KEY_STORAGE = "openrouter_api_key";

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

  async chatStream(body: any, signal: AbortSignal, onDelta: (chunk: string) => void) {
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
