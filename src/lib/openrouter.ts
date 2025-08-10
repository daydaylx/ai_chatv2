/**
 * OpenRouter API – schlanker Client für Browser/Vite (ohne externe Deps).
 * Ziele:
 *  - Korrekte Syntax (fix für vorherigen Backslash-Fehler)
 *  - Robuste Fehlerbehandlung mit eigener Error-Klasse
 *  - Optionaler API-Key via Vite-Env: VITE_OPENROUTER_API_KEY
 *  - Komfort-Helper für JSON-Requests
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Fehlerobjekt mit HTTP-Status + optionalen Details (z. B. JSON-Fehlerkörper). */
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

/** Liest den API-Key aus Vite-Env. Warnung nur im Dev-Modus. */
function getApiKey(): string {
  const env: any = (import.meta as any)?.env ?? {};
  const key = env.VITE_OPENROUTER_API_KEY ?? '';
  const isDev = !!env.DEV;
  if (!key && isDev) {
    // Hinweis: Ohne Key schlagen echte API-Calls fehl – App kann aber starten.
    // Setze VITE_OPENROUTER_API_KEY in deiner .env (siehe .env.example).
    console.warn('[openrouter] Kein VITE_OPENROUTER_API_KEY gesetzt (Dev-Hinweis).');
  }
  return String(key || '');
}

/** Pfad auflösen: führende Slashes entfernen und an Base anhängen. */
function buildUrl(path: string): string {
  const clean = String(path).replace(/^\/+/, '');
  return `${OPENROUTER_BASE_URL}/${clean}`;
}

/** Headers in ein flaches Record<string,string> normalisieren. */
function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => (out[k] = v));
    return out;
  }
  if (Array.isArray(h)) {
    const out: Record<string, string> = {};
    for (const [k, v] of h) out[String(k)] = String(v);
    return out;
  }
  return { ...(h as Record<string, string>) };
}

/**
 * Low-level Fetch zu OpenRouter.
 * - Setzt Authorization, wenn Key vorhanden.
 * - Serialisiert Body nur bei Bedarf.
 * - Wirft OpenRouterError bei !ok mit evtl. JSON-Details.
 */
export async function openRouterFetch(
  path: string,
  init: RequestInit & { body?: unknown } = {},
): Promise<Response> {
  const apiKey = getApiKey();
  const url = buildUrl(path);

  const headers = normalizeHeaders(init.headers);
  // Content-Type nur setzen, wenn Body nicht string/undefined (JSON default)
  const hasBody = init.body !== undefined;
  const isStringBody = typeof init.body === 'string';

  if (hasBody && !isStringBody && headers['Content-Type'] == null) {
    headers['Content-Type'] = 'application/json';
  }
  if (headers['Accept'] == null) headers['Accept'] = 'application/json';

  if (apiKey && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body =
    !hasBody
      ? undefined
      : isStringBody
      ? (init.body as string)
      : JSON.stringify(init.body);

  const resp = await fetch(url, { ...init, headers, body });

  if (!resp.ok) {
    // Versuche JSON-Fehler zu lesen, sonst Text.
    let details: unknown;
    try {
      const ct = resp.headers.get('content-type') || '';
      details = ct.includes('application/json') ? await resp.json() : await resp.text();
    } catch {
      /* ignore read error */
    }
    const msg =
      typeof details === 'string'
        ? details
        : (details as any)?.error?.message ||
          `OpenRouter-Fehler ${resp.status} ${resp.statusText}`;
    throw new OpenRouterError(String(msg), resp.status, resp.statusText, details);
  }

  return resp;
}

/**
 * Komfort-Helper: Holt JSON und tippt generisch.
 * Beispiel:
 *   const data = await openRouterJson<{ id: string }>('models', { method: 'GET' });
 */
export async function openRouterJson<T>(
  path: string,
  init: RequestInit & { body?: unknown } = {},
): Promise<T> {
  const r = await openRouterFetch(path, init);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await r.text().catch(() => '');
    throw new OpenRouterError(
      'Unerwartetes Response-Format (erwartet JSON).',
      r.status,
      r.statusText,
      text,
    );
  }
  return (await r.json()) as T;
}

/** Default-Export für rückwärtskompatible Imports. */
export default OPENROUTER_BASE_URL;

