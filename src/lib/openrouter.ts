export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterModel = {
  id: string;
  name?: string;
  vendor?: string;
  context_length?: number;
};

type ChatParams = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  onDelta?: (token: string) => void;
  signal?: AbortSignal;
};

export class OpenRouterClient {
  private key: string | null;
  constructor() {
    this.key = (typeof localStorage !== "undefined" && localStorage.getItem("openrouter_api_key")) || null;
  }
  getApiKey(): string {
    return this.key ?? "";
  }
  setApiKey(k: string) {
    this.key = k;
    if (typeof localStorage !== "undefined") localStorage.setItem("openrouter_api_key", k);
  }
  clearApiKey() {
    this.key = null;
    if (typeof localStorage !== "undefined") localStorage.removeItem("openrouter_api_key");
  }

  async listModels(): Promise<OpenRouterModel[]> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.key) headers["Authorization"] = "Bearer " + this.key;
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/models", { headers });
      if (!resp.ok) throw new Error(String(resp.status));
      const data = await resp.json();
      const items = Array.isArray(data?.data) ? data.data : [];
      return items.map((m: any) => ({
        id: String(m?.id ?? ""),
        name: String(m?.name ?? m?.id ?? ""),
        vendor: String(m?.provider?.name ?? "").toLowerCase() || undefined,
        context_length: Number(m?.context_length ?? 0) || undefined,
      })).filter((m: OpenRouterModel) => !!m.id);
    } catch {
      return [
        { id: "openai/gpt-4o-mini", name: "GPT-4o mini", vendor: "openai", context_length: 128000 },
        { id: "openai/gpt-4o", name: "GPT-4o", vendor: "openai", context_length: 128000 },
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", vendor: "anthropic", context_length: 200000 },
        { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct", vendor: "meta", context_length: 128000 },
        { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", vendor: "google", context_length: 1000000 }
      ];
    }
  }

  async chat(params: ChatParams): Promise<{ content: string }> {
    const { model, messages, temperature = 0.7, max_tokens = 1024, stream, onDelta, signal } = params;
    const body = { model, messages, temperature, max_tokens, stream: !!stream };
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.key) headers["Authorization"] = "Bearer " + this.key;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error("OpenRouter error: " + resp.status + " " + t);
    }

    if (stream) {
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Streaming not supported in this environment");
      const decoder = new TextDecoder("utf-8");
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const json = JSON.parse(jsonStr);
            const delta = json?.choices?.[0]?.delta?.content ?? "";
            if (delta) { full += delta; onDelta?.(delta); }
          } catch {}
        }
      }
      return { content: full };
    } else {
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      return { content };
    }
  }
}
