/**
 * OpenRouter API-Konstanten & Helper.
 * - Fix: gültiger Stringabschluss (vorher: fehlerhaftes `\";`).
 * - Defensive Defaults + klare Fehlermeldungen.
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Liest den API-Key aus Vite-Env. Warnung statt Crash, damit Dev-Server startet. */
function getApiKey(): string {
  const key = (import.meta as any)?.env?.VITE_OPENROUTER_API_KEY ?? '';
  if (!key) {
    // Hinweis: Ohne Key schlagen Requests zur API fehl – Build/Dev bleibt aber lauffähig.
    // Setze VITE_OPENROUTER_API_KEY in .env (siehe .env.example).
    console.warn('[openrouter] Kein VITE_OPENROUTER_API_KEY gesetzt.');
  }
  return String(key);
}

/**
 * Dünner Wrapper um fetch für OpenRouter-Endpunkte.
 * - Normalisiert Pfad/Headers
 * - JSON-Body Serialisierung
 * - Fehler mit Response-Text für schnellere Diagnose
 */
export async function openRouterFetch(
  path: string,
  init: RequestInit & { body?: unknown } = {},
): Promise<Response> {
  const apiKey = getApiKey();
  const url = `${OPENROUTER_BASE_URL}/${String(path).replace(/^\/+/, '')}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  // Authorization nur setzen, wenn Key vorhanden ist (sonst z. B. bei local mocks sauber)
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const body =
    typeof init.body === 'string'
      ? init.body
      : init.body != null
      ? JSON.stringify(init.body)
      : undefined;

  const resp = await fetch(url, { ...init, headers, body });

  if (!resp.ok) {
    let text = '';
    try {
      text = await resp.text();
    } catch {
      /* ignore */
    }
    throw new Error(`OpenRouter-Fehler ${resp.status}: ${text || resp.statusText}`);
  }

  return resp;
}

/** Kompatibilität: falls anderswo ein Default-Export des Base-URL erwartet wurde. */
export default OPENROUTER_BASE_URL;