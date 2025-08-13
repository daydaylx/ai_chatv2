export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  input_price?: number;
  output_price?: number;
  pricing?: any;
};

const BASE = 'https://openrouter.ai/api/v1';
const LS_KEY = 'openrouter_api_key';

function envKey(): string {
  const anyEnv: any = (import.meta as any)?.env || {};
  return String(anyEnv.VITE_OPENROUTER_API_KEY || '');
}

function authHeader(): string | null {
  const key = localStorage.getItem(LS_KEY) || envKey();
  return key ? `Bearer ${key}` : null;
}

async function ensureJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Unerwartetes Response-Format (${ct})`);
  }
  return (await res.json()) as T;
}

export class OpenRouterClient {
  getApiKey(): string { return localStorage.getItem(LS_KEY) || envKey() || ''; }
  setApiKey(key: string) { if (key) localStorage.setItem(LS_KEY, key); }
  clearApiKey() { localStorage.removeItem(LS_KEY); }

  async listModels(): Promise<OpenRouterModel[]> {
    const headers: Record<string,string> = { 'Accept':'application/json' };
    const auth = authHeader();
    if (auth) headers['Authorization'] = auth;

    const res = await fetch(`${BASE}/models`, { headers });
    if (!res.ok) {
      let msg = `OpenRouter Fehler ${res.status}`;
      try {
        const j: any = await ensureJson<any>(res);
        msg = j?.error?.message || msg;
      } catch (e) {
        void e; // JSON nicht parsebar – Standardfehlermeldung beibehalten
      }
      throw new Error(msg);
    }

    const data: any = await ensureJson<any>(res);
    const list = data?.data ?? [];
    return list.map((m: any) => {
      const id = m.id ?? m.slug ?? '';
      return {
        id,
        name: m.name ?? id,
        context_length: m.context_length,
        input_price: m.input_price,
        output_price: m.output_price,
        pricing: m.pricing
      } as OpenRouterModel;
    }).filter((m: OpenRouterModel) => !!m.id);
  }

  async chat(opts: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
  }): Promise<{ content: string }> {
    const headers: Record<string,string> = { 'Accept':'application/json', 'Content-Type':'application/json' };
    const auth = authHeader();
    if (auth) headers['Authorization'] = auth;

    const body = {
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024
    };

    const res = await fetch(`${BASE}/chat/completions`, { method:'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      let msg = `OpenRouter Fehler ${res.status}`;
      try {
        const j: any = await ensureJson<any>(res);
        msg = j?.error?.message || msg;
      } catch (e) {
        void e; // JSON nicht parsebar – Standardfehlermeldung beibehalten
      }
      throw new Error(msg);
    }

    const data: any = await ensureJson<any>(res);
    const text = data?.choices?.[0]?.message?.content ?? '';
    return { content: String(text) };
  }
}
