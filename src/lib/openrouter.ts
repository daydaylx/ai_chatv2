export type ORModel = {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  pricing?: { prompt: string; completion: string };
  top_provider?: { context_length?: number };
  per_request_limits?: { requests_per_minute?: number };
  // Normalisierte Flags (wir setzen die später im Catalog)
  free?: boolean;
  fast?: boolean;
  allow_nsfw?: boolean;
};

export async function fetchModels(apiKey: string): Promise<ORModel[]> {
  const url = "https://openrouter.ai/api/v1/models";
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": location.origin,
      "X-Title": "Disa AI",
    },
  });
  if (!res.ok) throw new Error(`OpenRouter list models failed: ${res.status}`);
  const json = await res.json();
  return (json.data ?? []) as ORModel[];
}
