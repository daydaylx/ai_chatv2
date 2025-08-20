export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type StreamOptions = {
  apiKey: string;
  model: string;
  system?: string | null;
  messages: ChatMsg[];
  onToken: (t: string) => void;
  onDone: (full: string) => void;
  onError: (err: Error) => void;
  signal?: AbortSignal | null;
  maxTokensOut?: number;
};

export async function streamChat(opts: StreamOptions): Promise<void> {
  const controller = new AbortController();
  const signal = mergeSignal(opts.signal, controller.signal);
  let acc = "";
  try {
    const payload = {
      model: opts.model,
      stream: true,
      messages: [
        ...(opts.system ? [{ role: "system", content: opts.system }] as ChatMsg[] : []),
        ...opts.messages,
      ],
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok || !res.body) {
      const txt = await safeText(res);
      throw new Error(`OpenRouter stream failed: ${res.status} ${txt}`.trim());
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;

    while (!done) {
      const { value, done: rdDone } = await reader.read();
      if (rdDone) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        const t = line.trim();
        if (!t || !t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") { done = true; break; }
        try {
          const json = JSON.parse(data);
          const delta: string = json.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            acc += delta;
            opts.onToken(delta);
            if (opts.maxTokensOut && acc.length >= opts.maxTokensOut) {
              controller.abort();
              done = true;
              break;
            }
          }
        } catch {
          // ignore
        }
      }
    }
    opts.onDone(acc);
  } catch (e: any) {
    if (e?.name === "AbortError") { opts.onDone(acc); return; }
    opts.onError(e instanceof Error ? e : new Error(String(e)));
  }
}

function mergeSignal(a?: AbortSignal | null, b?: AbortSignal | null): AbortSignal | undefined {
  if (!a && !b) return undefined;
  if (a && !b) return a;
  if (!a && b) return b;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  a!.addEventListener("abort", onAbort);
  b!.addEventListener("abort", onAbort);
  return ctrl.signal;
}

async function safeText(r: Response): Promise<string> { try { return await r.text(); } catch { return ""; } }
