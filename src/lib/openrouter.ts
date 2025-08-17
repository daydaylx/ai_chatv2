export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterModel = {
  id: string;
  name?: string;
  /** optional: vom API-Listing; in der UI rein informativ */
  context_length?: number;
};

const KEY_STORAGE = "openrouter_api_key";

export class OpenRouterClient {
  private apiKey: string | null;

  constructor() {
    const fromEnv = (import.meta as any)?.env?.VITE_OPENROUTER_API_KEY || "";
    const fromLS = (typeof localStorage !== "undefined") ? localStorage.getItem(KEY_STORAGE) : null;
    this.apiKey = (fromLS && fromLS.trim()) ? fromLS : (fromEnv?.trim() ? fromEnv : null);
  }

  getApiKey(): string | null { return this.apiKey; }

  setApiKey(key: string) {
    this.apiKey = key;
    try { localStorage.setItem(KEY_STORAGE, key); } catch {}
  }

  clearApiKey() {
    this.apiKey = null;
    try { localStorage.removeItem(KEY_STORAGE); } catch {}
  }

  async listModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) throw new Error("Kein API-Key gesetzt.");
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Authorization": `Bearer ${this.apiKey}` }
    });
    if (!res.ok) {
      let msg = `Fehler ${res.status}`;
      try { const data = await res.json(); msg = data?.error?.message || msg; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    const arr = Array.isArray(data?.data) ? data.data : [];
    return arr.map((m: any) => ({
      id: String(m.id || m.name || "").trim(),
      name: m.name,
      context_length: typeof m?.context_length === "number" ? m.context_length : undefined
    }));
  }
}
