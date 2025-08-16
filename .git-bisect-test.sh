#!/usr/bin/env bash
set -euo pipefail
rm -rf node_modules dist .vite || true
if [ -f package-lock.json ] || [ -f pnpm-lock.yaml ] || [ -f yarn.lock ]; then
  npm ci >/dev/null 2>&1 || npm install
else
  npm install
fi

# Fallback-Kette: build-Script -> vite build -> tsc -b -> typecheck
if npm run | grep -qE '^ *build'; then
  npm run build
elif npx --yes vite -v >/dev/null 2>&1; then
  npx vite build
elif npx --yes tsc -v >/dev/null 2>&1; then
  npx tsc -b || npx tsc --noEmit
else
  # Wenn nichts vorhanden ist, werten wir den Commit als "bad"
  echo "No build/typecheck available" >&2
  exit 1
fi
# Wenn wir hier ankommen → "good"
exit 0
