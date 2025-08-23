export type ChatMsg = { role: "system" | "user" | "assistant"; content: string; };

type StreamOpts = {
  apiKey: string;
  model: string;
  system: string | null;
  messages: ChatMsg[];
  maxTokensOut?: number;
  onToken: (t: string) => void;
  onDone: (full: string) => void;
  onError: (e: Error) => void;
  signal?: AbortSignal;
};

export async function streamChat(opts: StreamOpts) {
  const { apiKey, model, system, messages, maxTokensOut = 2048, onToken, onDone, onError, signal } = opts;
  const body = {
    model,
    stream: true,
    max_tokens: maxTokensOut,
    messages: (system ? [{ role: "system", content: system } as ChatMsg] : []).concat(messages),
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": location.origin,
        "X-Title": "Disa AI",
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`OpenRouter stream failed: ${res.status}`);

    const reader = res.body.getReader();
    const dec = new TextDecoder("utf-8");
    let acc = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        const l = line.trim();
        if (!l.startsWith("data:")) continue;
        const data = l.slice(5).trim();
        if (data === "[DONE]") break;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content ?? "";
          if (delta) { acc += delta; onToken(delta); }
        } catch { /* ignore */ }
      }
    }
    onDone(acc);
  } catch (e: any) {
    onError(e);
  }
}
