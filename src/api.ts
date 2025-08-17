export async function chatCompletion(prompt: string): Promise<string> {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!resp.ok) throw new Error("API error");
  const data = await resp.json();
  return (data.text ?? data.message ?? "").toString();
}
