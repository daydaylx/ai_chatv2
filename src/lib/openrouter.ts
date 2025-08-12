/**
 * OpenRouter API-Client (Browser, private Nutzung).
 * - API-Key aus localStorage("openrouter_api_key") oder Vite-Env.
 * - listModels() und chat() (nicht-streaming) mit Fehlerbehandlung.
 * Hinweis: Client-seitige Keys sind nur für private Builds geeignet.
 */

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: number; completion?: number; currency?: string };
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  raw: unknown;
}

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'\;

function readApiKey(): string | null {
  // Priorität: localStorage → .env (Vite)
  try {
    const ls = localStorage.getItem('openrouter_api_key');
    if (ls && ls.trim()) return ls.trim();
  } catch {
    /* SSR / Privacy */
  }
  const env = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
  return env && env.trim() ? env.trim() : null;
}

function commonHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  // optionale, von OpenRouter empfohlene Header
  try {
    headers['HTTP-Referer'] = location?.origin ?? 'http://localhost'\;
  } catch {
    /* ignore */
  }
  headers['X-Title'] = 'AI Chat (private)';
  return headers;
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      // OpenRouter-Fehler sitzen häufig unter error.message
      detail = (data as any)?.error?.message || JSON.stringify(data);
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${detail || 'Unbekannter Fehler'}`);
  }
  return res;
}

/** Modelle abrufen (benötigt gültigen API-Key) */
export async function listModels(signal?: AbortSignal): Promise<OpenRouterModel[]> {
  const key = readApiKey();
  if (!key) throw new Error('Kein OpenRouter API-Key konfiguriert.');
  const res = await safeFetch(`${OPENROUTER_BASE}/models`, {
    method: 'GET',
    headers: commonHeaders(key),
    signal,
  });
  const data = await res.json();
  const models = ((data as any)?.data ?? []) as any[];
  return models.map((m) => ({
    id: m.id ?? m.slug ?? '',
    name: m.name ?? m.id,
    context_length: m.context_length,
    pricing: m.pricing,
  }));
}

/** Nicht‑streaming Chat‑Completion */
export async function chat(model: string, messages: ChatMessage[], signal?: AbortSignal): Promise<ChatResponse> {
  if (!model) throw new Error('Kein Modell angegeben.');
  const key = readApiKey();
  if (!key) throw new Error('Kein OpenRouter API-Key konfiguriert.');

  const body = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: false,
  };

  const res = await safeFetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: commonHeaders(key),
    body: JSON.stringify(body),
    signal,
  });
  const data: any = await res.json();

  const choice = data?.choices?.[0];
  const content: string = choice?.message?.content ?? '';
  const modelUsed: string = data?.model ?? choice?.model ?? model;

  // Fallback-ID falls API keine liefert
  const id: string =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    id: data?.id ?? id,
    model: modelUsed,
    content,
    raw: data,
  };
}
