/**

OpenRouter API-Client (Browser, nur private Nutzung).

Liest API-Key aus localStorage ("openrouter_api_key") oder aus Vite-Env.

Bietet Model-Liste und Chat (nicht-streaming) mit robuster Fehlerbehandlung.
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
// Weitere Felder nach Bedarf
}

export interface ChatResponse {
id: string;
model: string;
content: string;
raw: any;
}

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'\;

function readApiKey(): string | null {
// Priorität: localStorage → Env
try {
const ls = localStorage.getItem('openrouter_api_key');
if (ls && ls.trim()) return ls.trim();
} catch { /* SSR / Privacy */ }
const env = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
return env && env.trim() ? env.trim() : null;
}

function commonHeaders(apiKey: string) {
const headers: Record<string, string> = {
'Content-Type': 'application/json',
'Authorization': Bearer ${apiKey},
};
// Optional empfehlene Header (werden von OpenRouter geloggt)
try {
headers['HTTP-Referer'] = location?.origin ?? 'http://localhost'\;
} catch { /* ignore */ }
headers['X-Title'] = 'AI Chat v2 (private)';
return headers;
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
const res = await fetch(url, { ...init });
if (!res.ok) {
let detail = '';
try {
const data = await res.json();
detail = data?.error?.message || JSON.stringify(data);
} catch {
detail = await res.text();
}
throw new Error(HTTP ${res.status} ${res.statusText} – ${detail || 'Unbekannter Fehler'});
}
return res;
}

/** Modelle abrufen */
export async function listModels(signal?: AbortSignal): Promise<OpenRouterModel[]> {
const key = readApiKey();
if (!key) throw new Error('Kein OpenRouter API-Key konfiguriert.');
const res = await safeFetch(${OPENROUTER_BASE}/models, {
method: 'GET',
headers: commonHeaders(key),
signal,
});
const data = await res.json();
const models = (data?.data ?? []) as any[];
return models.map((m) => ({
id: m.id ?? m.slug ?? '',
name: m.name ?? m.id,
context_length: m.context_length,
pricing: m.pricing,
}));
}

/** Einfaches Chat-Completions (nicht-streaming) */
export async function chat(model: string, messages: ChatMessage[], signal?: AbortSignal): Promise<ChatResponse> {
if (!model) throw new Error('Kein Modell angegeben.');
const key = readApiKey();
if (!key) throw new Error('Kein OpenRouter API-Key konfiguriert.');

// Minimaler Payload – kompatibel zu OpenAI-Format
const body = {
model,
messages: messages.map(m => ({ role: m.role, content: m.content })),
stream: false,
};

const res = await safeFetch(${OPENROUTER_BASE}/chat/completions, {
method: 'POST',
headers: commonHeaders(key),
body: JSON.stringify(body),
signal,
});
const data = await res.json();

// tolerant extrahieren
const choice = data?.choices?.[0];
const content = choice?.message?.content ?? '';
const modelUsed = data?.model ?? choice?.model ?? model;

return {
id: data?.id ?? crypto.randomUUID(),
model: modelUsed,
content,
raw: data,
};
}
