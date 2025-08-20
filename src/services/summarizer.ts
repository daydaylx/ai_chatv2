import type { ChatMsg } from "./chatStream";

export type Summary = { bullets: string[]; narrative: string; };

export type SummarizeOpts = {
  apiKey: string;
  model: string;
  history: ChatMsg[];
  maxChars?: number;
};

export function shouldSummarize(history: ChatMsg[], maxChars = 4000): boolean {
  const len = history.reduce((n, m) => n + m.content.length, 0);
  return history.length >= 20 || len >= maxChars;
}

export async function summarize(opts: SummarizeOpts): Promise<Summary> {
  const sys = "Du bist ein präziser Summarizer. Fasse den Dialog in maximal 7 klaren Stichpunkten zusammen und gib zusätzlich eine kurze, neutrale Erzählzusammenfassung in 2–5 Sätzen. Antworte als JSON mit {\"bullets\": string[], \"narrative\": string}.";
  const payload = {
    model: opts.model,
    stream: false,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Dialog:\n${serializeHistory(opts.history)}\n\nErzeuge NUR JSON.` }
    ]
  };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${opts.apiKey}` },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`summarize failed ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(text);
    const bullets: string[] = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 7).map(String) : [];
    const narrative: string = typeof parsed.narrative === "string" ? parsed.narrative : "";
    return { bullets, narrative };
  } catch {
    return { bullets: [], narrative: "" };
  }
}

function serializeHistory(h: ChatMsg[]): string {
  return h.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
}
