/* eslint-disable @typescript-eslint/no-explicit-any */
export type Price = { prompt?: number; completion?: number; image?: number };

export type OpenRouterModel = {
  id: string;
  name: string;
  context_length?: number;
  pricing?: Price | Record<string, any>;
  description?: string;
  tags?: string[];
};

export type OpenRouterModelsResponse = { data: OpenRouterModel[] };

export class OpenRouterClient {
  private apiKey?: string;
  private cache: Map<string, any> = new Map();
  private ttl = 5 * 60_000;   // 5min
  private timeoutMs = 20_000; // 20s

  constructor(apiKey?: string) { this.apiKey = apiKey; }
  setApiKey(key?: string) { this.apiKey = key; }

  private key(url: string) { return `cache:${url}`; }
  private getCached<T>(url: string): T | null {
    const hit = this.cache.get(this.key(url));
    if (!hit) return null;
    if (Date.now() - hit.t > this.ttl) { this.cache.delete(this.key(url)); return null; }
    return hit.v as T;
  }
  private setCached<T>(url: string, v: T) { this.cache.set(this.key(url), { t: Date.now(), v }); }

  private async _fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const isGet = (init?.method || "GET").toUpperCase() === "GET";
      const base: Record<string, string> = {
        "HTTP-Referer": typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost",
        "X-Title": "AI Chat Mobile PWA",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      };
      const headers = isGet
        ? { ...base, ...(init?.headers as any) }
        : { "Content-Type": "application/json", ...base, ...(init?.headers as any) };

      return await fetch(input, { ...init, headers, signal: ctrl.signal });
    } finally { clearTimeout(t); }
  }

  async listModels(): Promise<OpenRouterModel[]> {
    const url = "https://openrouter.ai/api/v1/models"\;
    const res = await this._fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Models fetch failed: ${res.status}`);
    const json = (await res.json()) as OpenRouterModelsResponse | any;
    return Array.isArray(json?.data) ? json.data : [];
  }

  async listModelsCached(): Promise<OpenRouterModel[]> {
    const url = "https://openrouter.ai/api/v1/models"\;
    const hit = this.getCached<OpenRouterModel[]>(url);
    if (hit) return hit;
    const list = await this.listModels();
    this.setCached(url, list);
    return list;
  }
}
