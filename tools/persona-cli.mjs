#!/usr/bin/env node
// CLI für src/data/personas.json
// Befehle:
//   node tools/persona-cli.mjs list
//   node tools/persona-cli.mjs check
//   node tools/persona-cli.mjs add --id <id> --label "<label>" --description "<desc>" --system "<system>" [--allow "openai/*,anthropic/*"] [--deny "anbieter/*"]
//   node tools/persona-cli.mjs rm --id <id>
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const personasPath = path.resolve(__dirname, "../src/data/personas.json");

function parseArgs(argv) {
  const [,, cmd, ...rest] = argv;
  const args = {};
  for (let i = 0; i < rest.length; i++) {
    const k = rest[i];
    if (!k.startsWith("--")) continue;
    const key = k.slice(2);
    const val = (i + 1 < rest.length && !rest[i+1].startsWith("--")) ? rest[++i] : "true";
    args[key] = val;
  }
  return { cmd, args };
}

function validId(id) { return /^[a-z0-9][a-z0-9._-]{1,63}$/.test(id); }
function normStr(s) { return String(s).replace(/\s+/g, " ").trim(); }

async function load() {
  const buf = await readFile(personasPath, "utf8");
  const data = JSON.parse(buf);
  if (!Array.isArray(data)) throw new Error("personas.json: Array erwartet");
  return data;
}

async function save(list) {
  list.sort((a, b) => (a.label.localeCompare(b.label) || a.id.localeCompare(b.id)));
  const json = JSON.stringify(list, null, 2) + "\n";
  const tmp = personasPath + ".tmp";
  await writeFile(tmp, json, "utf8");
  await rename(tmp, personasPath);
}

function parseListArg(v) {
  if (!v || v === "true") return [];
  return String(v).split(",").map(s => normStr(s)).filter(Boolean);
}

async function listCmd() {
  const list = await load();
  list.sort((a, b) => (a.label.localeCompare(b.label) || a.id.localeCompare(b.id)));
  for (const it of list) console.log(`${String(it.id).padEnd(16)}  ${it.label}`);
}

async function checkCmd() {
  const list = await load();
  const seen = new Set();
  const problems = [];
  for (const [i, it] of list.entries()) {
    const id = normStr(it.id || "");
    if (!validId(id)) problems.push(`Eintrag ${i}: ungültige id "${it.id}"`);
    if (seen.has(id)) problems.push(`Eintrag ${i}: doppelte id "${id}"`);
    seen.add(id);
    const label = normStr(it.label || "");
    const description = normStr(it.description || "");
    const system = String(it.system || "").trim();
    if (label.length < 1 || label.length > 64) problems.push(`Eintrag ${i}: label Länge 1..64`);
    if (description.length < 1 || description.length > 200) problems.push(`Eintrag ${i}: description Länge 1..200`);
    if (system.length < 1 || system.length > 4000) problems.push(`Eintrag ${i}: system Länge 1..4000`);
    if (Array.isArray(it.allow) && Array.isArray(it.deny) && it.allow.length && it.deny.length) {
      problems.push(`Eintrag ${i}: allow und deny gleichzeitig gesetzt`);
    }
  }
  if (problems.length) {
    console.error("Fehler in personas.json:");
    for (const p of problems) console.error(" - " + p);
    process.exit(1);
  } else {
    console.log("OK: personas.json ist gültig.");
  }
}

async function addCmd(args) {
  const id = normStr(args.id || "");
  const label = normStr(args.label || "");
  const description = normStr(args.description || "");
  const system = String(args.system || "").trim();
  const allow = parseListArg(args.allow);
  const deny  = parseListArg(args.deny);

  if (!id || !validId(id)) die('Bitte gültige --id angeben (^[a-z0-9][a-z0-9._-]{1,63}$)');
  if (!label) die("Bitte --label angeben");
  if (!description) die("Bitte --description angeben");
  if (!system) die("Bitte --system angeben");
  if (allow.length && deny.length) die("Nur --allow oder --deny verwenden, nicht beides");

  const list = await load();
  if (list.some(it => String(it.id) === id)) die(`id "${id}" existiert bereits`);
  const item = { id, label, description, system };
  if (allow.length) item.allow = allow;
  if (deny.length) item.deny = deny;
  list.push(item);
  await save(list);
  console.log(`OK: hinzugefügt -> ${id}`);
}

async function rmCmd(args) {
  const id = normStr(args.id || "");
  if (!id) die("Bitte --id angeben");
  const list = await load();
  const next = list.filter(it => String(it.id) !== id);
  if (next.length === list.length) die(`id "${id}" nicht gefunden`);
  await save(next);
  console.log(`OK: entfernt -> ${id}`);
}

function die(msg) { console.error(msg); process.exit(1); }

async function main() {
  const { cmd, args } = parseArgs(process.argv);
  switch (cmd) {
    case "list":  return listCmd();
    case "check": return checkCmd();
    case "add":   return addCmd(args);
    case "rm":    return rmCmd(args);
    default:
      console.log(`Usage:
  node tools/persona-cli.mjs list
  node tools/persona-cli.mjs check
  node tools/persona-cli.mjs add --id <id> --label "<label>" --description "<desc>" --system "<system>" [--allow "openai/*,anthropic/*"] [--deny "anbieter/*"]
  node tools/persona-cli.mjs rm --id <id>`);
  }
}
main().catch(e => { console.error(e?.stack || e?.message || String(e)); process.exit(1); });
