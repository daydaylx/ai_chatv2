export function formatRelative(ts: number): string {
  const now = Date.now();
  const d = Math.max(0, now - ts);
  const sec = Math.floor(d / 1000);
  if (sec < 10) return "gerade eben";
  if (sec < 60) return `vor ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const day = Math.floor(h / 24);
  if (day === 1) return "gestern";
  if (day < 7) return `vor ${day} Tagen`;
  // Fallback: Datum kurz
  const dt = new Date(ts);
  return dt.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}
