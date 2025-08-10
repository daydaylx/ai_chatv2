#!/usr/bin/env bash
# repo_cleanup.sh — robustes Repo-Aufräum- und Build-Skript
# - Findet automatisch das Git-Root (auch wenn du es "falsch" startest)
# - Bereinigt Build-Artefakte aus dem Index
# - Stellt eine sinnvolle .gitignore sicher (append, kein blindes Überschreiben)
# - Entfernt doppelte ESLint-Configs (behalte TS)
# - Installiert Dependencies (npm/pnpm/yarn/bun) und baut das Projekt
# Nutzung:
#   bash scripts/repo_cleanup.sh                # aus beliebigem Ort
#   bash scripts/repo_cleanup.sh /pfad/zum/repo # optionales Startverzeichnis

set -Eeuo pipefail
trap 'echo "ERROR: $(basename "$0") failed at line $LINENO" >&2' ERR

# ---------- Hilfsfunktionen ----------
say() { printf "%s\n" "$*" ; }
section() { printf "\n== %s ==\n" "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

# Finde Git-Root: Candidate-Reihenfolge -> $1, Skriptordner/.., $PWD
find_git_root() {
  local cand=()
  local script_dir
  script_dir="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  cand+=("${1:-}")
  cand+=("$script_dir/..")
  cand+=("$PWD")
  for d in "${cand[@]}"; do
    [[ -n "$d" ]] || continue
    if GIT_DIR=$(git -C "$d" rev-parse --git-dir 2>/dev/null); then
      git -C "$d" rev-parse --show-toplevel
      return 0
    fi
  done
  return 1
}

ensure_gitignore_has() {
  local line="$1"
  if [[ ! -f .gitignore ]]; then
    : > .gitignore
  fi
  if ! grep -qxF -- "$line" .gitignore; then
    echo "$line" >> .gitignore
    git add .gitignore >/dev/null 2>&1 || true
  fi
}

pm_detect() {
  if [[ -f pnpm-lock.yaml ]] && have pnpm; then echo pnpm; return; fi
  if [[ -f bun.lockb ]] && have bun; then echo bun; return; fi
  if [[ -f yarn.lock ]] && have yarn; then echo yarn; return; fi
  echo npm
}

pm_install() {
  case "$1" in
    pnpm) pnpm install --frozen-lockfile ;;
    yarn) yarn install --frozen-lockfile || yarn install ;;
    bun)  bun install ;;
    npm)  if [[ -f package-lock.json ]]; then npm ci; else npm install; fi ;;
    *)    npm install ;;
  esac
}

pm_run() {
  local pm="$1"; shift
  case "$pm" in
    pnpm) pnpm run -s "$@" ;;
    yarn) yarn run -s "$@" || yarn "$@" ;;
    bun)  bun run "$@" ;;
    npm|*) npm run -s "$@" ;;
  esac
}

# ---------- Start ----------
GIT_ROOT="$(find_git_root "${1:-}")" || {
  echo "Kein Git-Repo gefunden. Starte das Skript im Projekt oder gib den Pfad an:" >&2
  echo "  bash scripts/repo_cleanup.sh /pfad/zum/repo" >&2
  exit 1
}
cd "$GIT_ROOT"

section "Repo erkannt"
say "[root] $GIT_ROOT"

section ".gitignore sicherstellen"
ensure_gitignore_has "node_modules/"
ensure_gitignore_has "dist/"
ensure_gitignore_has "build/"
ensure_gitignore_has ".vite/"
ensure_gitignore_has "*.log"
ensure_gitignore_has ".env"
ensure_gitignore_has ".env.*"
ensure_gitignore_has "*.local"
ensure_gitignore_has ".DS_Store"
ensure_gitignore_has "Thumbs.db"
ensure_gitignore_has ".vercel"
ensure_gitignore_has ".netlify"
ensure_gitignore_has ".vscode/"
ensure_gitignore_has ".idea/"

section "Artefakte aus dem Index entfernen (falls vorhanden)"
git rm -r --cached -q --ignore-unmatch node_modules dist build .vite || true

section "Doppelte ESLint-Konfig bereinigen"
if [[ -f eslint.config.js && -f eslint.config.ts ]]; then
  say "-> entferne eslint.config.js (behalte TS)"
  git rm -q --cached --ignore-unmatch eslint.config.js || true
  rm -f eslint.config.js || true
fi

section "Änderungen committen (falls vorhanden)"
git add -A
if git diff --cached --quiet; then
  say "[git] Nichts zu committen."
else
  git commit -m "repo: cleanup – ignore artifacts, drop duplicates, normalize" || true
fi

section "Paketmanager & Dependencies"
PM="$(pm_detect)"
say "[pm] erkannt: $PM"
pm_install "$PM"

section "Typecheck (optional)"
if [[ -f tsconfig.json ]]; then
  if have tsc; then
    npx --yes tsc -p .
  else
    say "tsc nicht global – nutze npx"
    npx --yes tsc -p .
  fi
else
  say "tsconfig.json nicht gefunden – überspringe Typecheck."
fi

section "Build"
pm_run "$PM" build

say ""
say "✔ Cleanup & Build abgeschlossen."
