# AI Chat v2 – Reparierter Stand (privater Gebrauch)

Dieser Stand behebt Syntax-/Build-Fehler (korruptes SW/CSS/TSX/Config) und bringt eine robuste OpenRouter-Anbindung.

## Schnellstart (Node 22)
```bash
npm ci
cp .env.example .env   # optional: API-Key eintragen
npm run dev
# Build:
npm run build && npm run preview
API-Key
Entweder in der App im Header eingeben (localStorage), oder

in .env setzen: VITE_OPENROUTER_API_KEY=sk-or-...

Prüfen
Dev-Server startet ohne Fehler.

Modelle im Select werden geladen.

Chat funktioniert (Antwort erscheint).

PWA: npm run build && npm run preview, dann im Browser DevTools > Application > Service Workers: SW aktiv, keine Fehler. Offline-Reload lädt Shell (API bleibt online-only).

Sicherheit & Grenzen
Client-seitiger Key ist nur für privaten, lokalen Gebrauch geeignet.

Der Service Worker cached keine API-Calls (OpenRouter), um Stale-Responses zu vermeiden.
