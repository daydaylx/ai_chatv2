const KEY = "openrouter_api_key";

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch { return null; }
}

export function setApiKey(value: string) {
  if (!value || !value.trim()) throw new Error("Leerer API-Key.");
  localStorage.setItem(KEY, value.trim());
}

export function clearApiKey() {
  localStorage.removeItem(KEY);
}
