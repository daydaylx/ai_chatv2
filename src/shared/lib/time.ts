const rtf = new Intl.RelativeTimeFormat("de", { numeric: "auto" });
export function formatRelative(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 60) return rtf.format(Math.round(diff / 60000), "minute");
  const hours = Math.round(abs / 3600000);
  if (hours < 24) return rtf.format(Math.round(diff / 3600000), "hour");
  const days = Math.round(abs / 86400000);
  return rtf.format(Math.round(diff / 86400000), "day");
}
