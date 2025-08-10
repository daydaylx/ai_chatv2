export type FetchFn = typeof fetch;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: any;
  price?: any;
  context_length?: number;
  contextLength?: number;
  tags?: string[];
  description?: string;
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

type ClientOpts = {
  timeoutMs?: number;
  baseUrl?: string;
  referer?: string;
  title?: string;
  fetchImpl?: FetchFn;
};

export class OpenRouterClient {
  private apiKey?: string;
  private baseUrl = "https://openrouter.ai/api/v1"\;
  private timeoutMs = 45000;
  private cache = new Map<string, any>();
  private fetchImpl: FetchFn;
  private referer = (typeof window !== "undefined" ? window.location.origin : "http://localhost");
  private title = "AI Chat PWA";

  constructor(apiKey?: string, opts: ClientOpts = {}) {
    this.apiKey = apiKey;
    if (opts.baseUrl) this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    if (opts.timeoutMs) this.timeoutMs = opts.timeoutMs;
    if (opts.referer) this.referer = opts.referer;
    if (opts.title) this.title = opts.title;
    this.fetchImpl = opts.fetchImpl || fetch;
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "HTTP-Referer": this.referer,
      "X-Title": this.title
    };
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`;
    return h;
  }

  private async _fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, headers: { ...(init.headers || {}), ...this.headers() }, signal: ac.signal });
    } finally {
      clearTimeout(t);
    }
  }

  private cacheKey(url: string) { return `cache:${url}`; }
  private getCached<T>(url: string): T | null {
    const k = this.cacheKey(url);
    const v = this.cache.get(k);
    if (!v) return null;
    if (Date.now() > v.expires) { this.cache.delete(k); return null; }
    return v.data as T;
  }
  private setCached<T>(url: string, data: T, ttlMs = 5 * 60_000) {
    const k = this.cacheKey(url);
    this.cache.set(k, { data, expires: Date.now() + ttlMs });
  }

  async listModels(): Promise<OpenRouterModel[]> {
    const url = `${this.baseUrl}/models`;
    const res = await this._fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Models fetch failed: ${res.status}`);
    const json = (await res.json()) as OpenRouterModelsResponse | any;
    const list: OpenRouterModel[] = Array.isArray((json as any)?.data) ? (json as any).data : [];
    return list;
  }

  async listModelsCached(): Promise<OpenRouterModel[]> {
    const url = `${this.baseUrl}/models`;
    const hit = this.getCached<OpenRouterModel[]>(url);
    if (hit) return hit;
    const list = await this.listModels();
    this.setCached(url, list);
    return list;
  }

  async chat(req: ChatRequest, signal?: AbortSignal): Promise<any> {
    const url = `${this.baseUrl}/chat/completions`;
    const res = await this._fetch(url, { method: "POST", body: JSON.stringify(req), signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Chat failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  async *chatStream(req: ChatRequest, signal?: AbortSignal): AsyncIterable<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const res = await this._fetch(url, { method: "POST", body: JSON.stringify({ ...req, stream: true }), signal });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Chat stream failed: ${res.status} ${text}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n");
      buf = parts.pop() || "";
      for (const line of parts) {
        const s = line.trim();
        if (!s || !s.startsWith("data:")) continue;
        const payload = s.slice(5).trim();
        if (payload === "[DONE]") return;
        yield payload;
      }
    }
    if (buf.trim().startsWith("data:")) {
      const payload = buf.trim().slice(5).trim();
      if (payload && payload !== "[DONE]") yield payload;
    }
  }
}
