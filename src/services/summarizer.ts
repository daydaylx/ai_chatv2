import { type ChatMsg, streamChat } from "./chatStream";

export function shouldSummarize(history: ChatMsg[]): boolean {
  if (history.length >= 20) return true;
  const chars = history.map(m => m.content.length).reduce((a,b) => a + b, 0);
  return chars > 4000;
}

export type SummarizeOpts = { apiKey: string; model: string; history: ChatMsg[]; };

export async function summarize({ apiKey, model, history }: SummarizeOpts): Promise<{ bullets: string[]; narrative: string; }> {
  const sys = "Fasse die Konversation äußerst knapp zusammen. Gib ein JSON der Form {\"bullets\": string[], \"narrative\": string}. Keine Erklärungen.";
  const user = "Erzeuge die Zusammenfassung (max 6 kurze Stichpunkte, plus 2-3 Sätze).";
  const msg: ChatMsg[] = [{ role: "user", content: user }];
  let acc = "";
  await streamChat({
    apiKey, model, system: sys, messages: history.slice(-8).concat(msg),
    maxTokensOut: 512,
    onToken: (t) => { acc += t; },
    onDone: () => {},
    onError: (e) => { throw e; },
  });
  try {
    const start = acc.indexOf("{");
    const end = acc.lastIndexOf("}");
    const json = JSON.parse(acc.slice(start, end + 1));
    const bullets: string[] = Array.isArray(json.bullets) ? json.bullets.map(String) : [];
    const narrative: string = typeof json.narrative === "string" ? json.narrative : "";
    return { bullets, narrative };
  } catch {
    // Fallback: naive Zerlegung
    const parts = acc.split("\n").filter(Boolean).map(s => s.replace(/^[-•]\s?/, "").trim());
    return { bullets: parts.slice(0,6), narrative: parts.slice(6).join(" ").slice(0,400) };
  }
}
