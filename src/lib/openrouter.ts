export type ORole = "system" | "user" | "assistant";

export type ORMessage = {
  role: ORole;
  content: string;
};

export type ChatOptions = {
  model: string;
  messages: ORMessage[];
  temperature?: number;
  max_tokens?: number;
};

/** Ergänzt, damit alte Imports weiter kompilieren */
export type OpenRouterModel = {
  id: string;
  name: string;
  provider?: string;
  label?: string;
};

const LS_KEY = "openrouter_api_key";

export class OpenRouterClient {
  getApiKey(): string | null {
    try {
      return localStorage.getItem(LS_KEY);
    } catch {
      return null;
    }
  }

  setApiKey(key: string) {
    localStorage.setItem(LS_KEY, key.trim());
  }

  clearApiKey() {
    localStorage.removeItem(LS_KEY);
  }

  async listModels(): Promise<OpenRouterModel[]> {
    // Schnell & stabil aus /public/models.json
    try {
      const res = await fetch("/models.json", { cache: "no-store" });
      if (!res.ok) throw new Error("models.json not found");
      const data = (await res.json()) as OpenRouterModel[];
      return data;
    } catch {
      return [
        { id: "google/gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
        { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI" },
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" }
      ];
    }
  }

  async chat(opts: ChatOptions): Promise<{ content: string }> {
    const apiKey = this.getApiKey();
    const hasCreds = !!apiKey && !!opts.model;

    // Mock-Mode: Falls kein Key/Modell gesetzt → lokale Demo-Antwort
    if (!hasCreds) {
      const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const mock =
        "💡 *Demo-Antwort (Mock-Mode)*\n\n" +
        "Kein API-Key/Modell gesetzt. Öffne die Einstellungen (Zahnrad) und trage deinen OpenRouter-Key ein, " +
        "wähle ein Modell – ab dann antwortet die Cloud-KI.\n\n" +
        "Du hast geschrieben:\n“" + lastUser + "”";
      await new Promise((r) => setTimeout(r, 500));
      return { content: mock };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": location.origin,
        "X-Title": "Disa AI"
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 1024
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${text || res.statusText}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return { content };
  }
}
