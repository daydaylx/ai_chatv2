#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC_SVG = path.resolve("assets/icon.svg");
const OUT_DIR = path.resolve("public/icons");
const targets = [
  { size: 192, out: "icon-192.png" },
  { size: 512, out: "icon-512.png" }
];

(async () => {
  if (!fs.existsSync(SRC_SVG)) {
    fs.mkdirSync(path.dirname(SRC_SVG), { recursive: true });
    fs.writeFileSync(SRC_SVG, `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="100%" height="100%" fill="#0b0f14"/>
  <g transform="translate(256,256)">
    <circle r="200" fill="#143667"/>
    <text x="0" y="18" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-size="180" fill="#e6edf3">AI</text>
  </g>
</svg>\n`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const t of targets) {
    const outPath = path.join(OUT_DIR, t.out);
    await sharp(SRC_SVG, { density: t.size * 2 })
      .resize(t.size, t.size, { fit: "cover" })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outPath);
    console.log("✔", outPath);
  }
})().catch((e) => {
  console.error("Icon-Generation failed:", e);
  process.exit(1);
});
