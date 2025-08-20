import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const ELL = "…"; // Unicode ellipsis U+2026
const BAD_PATTERNS = [
  // nackter Platzhalter auf eigener Zeile:
  /^\s*\.\.\.\s*$/m,
  // <<< deutlich kaputte Marker:
  /PLACEHOLDER|TODO_REPLACE/g,
];

function walk(dir, out=[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css|json)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
let bad = [];
for (const f of files) {
  const txt = readFileSync(f, "utf8");
  if (txt.includes(ELL)) bad.push([f, "unicode_ellipsis(…)"]);
  else if (BAD_PATTERNS.some(rx => rx.test(txt))) bad.push([f, "placeholder(...)"]);
}
if (!bad.length) {
  console.log("OK: keine offensichtlichen Ellipsen/Platzhalter gefunden.");
  process.exit(0);
}
console.log("Verdächtige Dateien:\n");
for (const [f, why] of bad) console.log(`- ${why}: ${f}`);
process.exit(1);
