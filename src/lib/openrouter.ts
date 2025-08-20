export type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  tags?: string[];
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
};

export async function listModels(apiKey: string): Promise<OpenRouterModel[]> {
  const url = "https://openrouter.ai/api/v1/models";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`OpenRouter listModels failed: ${res.status} ${msg}`.trim());
  }
  const json = await res.json();
  const arr = Array.isArray(json.data) ? json.data : [];

  return arr.map((m: any) => ({
    id: String(m.id),
    name: typeof m.name === "string" ? m.name : undefined,
    description: typeof m.description === "string" ? m.description : undefined,
    context_length: typeof m.context_length === "number" ? m.context_length : undefined,
    pricing: typeof m.pricing === "object" && m.pricing ? m.pricing : undefined,
    tags: Array.isArray(m.tags) ? m.tags : undefined,
    free: !!(m?.pricing && (m.pricing.prompt === "0" || m.pricing.prompt === "0.0")),
    allow_nsfw: Array.isArray(m?.tags) ? m.tags.some((t: string) => /nsfw|uncensored/i.test(t)) : false,
    fast: Array.isArray(m?.tags) ? m.tags.some((t: string) => /fast|turbo/i.test(t)) : false,
  }));
}

async function safeText(r: Response): Promise<string> {
  try { return await r.text(); } catch { return ""; }
}
