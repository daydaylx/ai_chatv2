/**
 * OpenRouter API – Browser/Vite-Client ohne externe Deps.
 * - Korrekte Syntax
 * - Named Exports: OpenRouterClient, OpenRouterModel, ChatMessage
 * - Fallback-Key: localStorage('openrouter_api_key') -> import.meta.env.VITE_OPENROUTER_API_KEY
 */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  input_price?: number;
  output_price?: number;
  pricing?: any;
  price?: any;
};

const LS_KEY = 'openrouter_api_key';

export class OpenRouterError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly details?: unknown;
  constructor(message: string, status: number, statusText: string, details?: unknown) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }
}

function getEnvKey(): string {
  const env: any = (import.meta as any)?.env || {};
  return String(env.VITE_OPENROUTER_API_KEY || '');
}

function buildUrl(path: string): string {
  return `${OPENROUTER_BASE_URL}/${String(path).replace(/^\//, '')}`;
}

function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const o: Record<string, string> = {};
    h.forEach((v, k) => (o[k] = v));
    return o;
  }
  if (Array.isArray(h)) {
    const o: Record<string, string> = {};
    for (const [k, v] of h) o[String(k)] = String(v);
    return o;
  }
  return { ...(h as Record<string, string>) };
}

type JsonInit = Omit<RequestInit, 'body'> & { body?: unknown };

export async function openRouterFetch(path: string, init: JsonInit = {}): Promise<Response> {
  const url = buildUrl(path);
  const headers = normalizeHeaders(init.headers);
  const hasBody = init.body !== undefined;
  const isStringBody = typeof init.body === 'string';

  if (hasBody && !isStringBody && headers['Content-Type'] == null) {
    headers['Content-Type'] = 'application/json';
  }
  if (headers['Accept'] == null) headers['Accept'] = 'application/json';

  const apiKey = headers['Authorization']?.startsWith('Bearer ')
    ? ''
    : (localStorage.getItem(LS_KEY) || getEnvKey());

  if (apiKey && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body =
    !hasBody ? undefined : isStringBody ? (init.body as string) : JSON.stringify(init.body);

  const resp = await fetch(url, { ...init, headers, body });
  if (!resp.ok) {
    let details: unknown;
    try {
      const ct = resp.headers.get('content-type') || '';
      details = ct.includes('application/json') ? await resp.json() : await resp.text();
    } catch { /* no-op */ }
    const msg =
      typeof details === 'string'
        ? details
        : (details as any)?.error?.message ||
          `OpenRouter-Fehler ${resp.status} ${resp.statusText}`;
    throw new OpenRouterError(String(msg), resp.status, resp.statusText, details);
  }
  return resp;
}

export async function openRouterJson<T>(path: string, init: JsonInit = {}): Promise<T> {
  const r = await openRouterFetch(path, init);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await r.text().catch(() => '');
    throw new OpenRouterError('Unerwartetes Response-Format (JSON erwartet).', r.status, r.statusText, text);
  }
  return (await r.json()) as T;
}

export class OpenRouterClient {
  getApiKey(): string {
    return localStorage.getItem(LS_KEY) || getEnvKey() || '';
  }
  
  setApiKey(key: string) {
    if (key) localStorage.setItem(LS_KEY, key);
  }
  
  clearApiKey() {
    localStorage.removeItem(LS_KEY);
  }

  async listModels(): Promise<OpenRouterModel[]> {
    const data = await openRouterJson<{ data: OpenRouterModel[] }>('models', { method: 'GET' });
    return (data?.data ?? []).filter(m => !!m.id);
  }

  async chat(opts: { 
    model: string; 
    messages: ChatMessage[]; 
    temperature?: number; 
    max_tokens?: number; 
  }): Promise<{ content: string }> {
    const res = await openRouterJson<any>('chat/completions', {
      method: 'POST',
      body: {
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 2048
      }
    });
    const text = res?.choices?.[0]?.message?.content ?? '';
    return { content: String(text) };
  }
}

export default OpenRouterClient;
