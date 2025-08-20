set -euo pipefail

root="$(cd "$(dirname "$0")/.."; pwd)"
cd "$root"

echo "[1/3] Backup alter (defekter) Ordner → .trash/"
mkdir -p .trash
for p in \
  src/features/memory \
  src/features/home \
  src/lib/memoryPipeline.ts \
  src/components/TypingIndicator.tsx \
  src/components/ChatListDrawer.tsx \
  src/components/ScrollToEnd.tsx \
  src/entities/memory \
  src/entities/persona.ts \
  src/entities/PersonaProvider.tsx \
  src/lib/openrouter.ts \
  src/lib/catalog.ts \
  src/features/settings/SettingsSheet.tsx \
  src/features/settings/PersonaPicker.tsx \
  src/components/Header.tsx \
  src/features/chat/ChatPanel.tsx \
  src/components/ChatInput.tsx \
  src/shared/ui/Button.tsx \
  src/shared/ui/Switch.tsx \
  src/shared/ui/Badge.tsx \
  src/shared/ui/Sheet.tsx \
  src/shared/ui/Spinner.tsx \
  src/shared/lib/theme.ts \
  src/features/models/ModelPicker.tsx \
  src/styles/globals.css \
  src/widgets/shell/AppShell.tsx
do
  if [ -e "$p" ]; then
    mkdir -p ".trash/$(dirname "$p")"
    git ls-files --error-unmatch "$p" >/dev/null 2>&1 && git rm -q "$p" || true
    mv "$p" ".trash/$p"
    echo "  moved $p"
  fi
done

echo "[2/3] Entferne eingebettetes .git im ZIP (falls vorhanden)"
rm -rf .git 2>/dev/null || true

echo "[3/3] Fertig. Jetzt neue Dateien einspielen."
