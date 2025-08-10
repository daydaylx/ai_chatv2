#!/bin/bash

# OpenRouter Integration Deployment Script
set -e

echo "🚀 OpenRouter Integration Deployment"
echo "==================================="

# 1. Security Check
echo "🔒 Security Check..."
if grep -RInE "sk-or-[A-Za-z0-9_-]{20,}" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null; then
    echo "❌ FEHLER: API-Keys im Code gefunden!"
    echo "   Entferne diese SOFORT und deaktiviere die Keys!"
    exit 1
else
    echo "✅ Keine API-Keys im Code gefunden"
fi

# 2. Dependencies Check  
echo "📦 Checking Dependencies..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm nicht gefunden"
    exit 1
fi

# 3. Backup existing files
echo "💾 Backup bestehender Dateien..."
mkdir -p .backup/$(date +%Y%m%d_%H%M%S)
[ -f src/lib/presets.ts ] && cp src/lib/presets.ts .backup/$(date +%Y%m%d_%H%M%S)/
[ -f src/components/PersonaPicker.tsx ] && cp src/components/PersonaPicker.tsx .backup/$(date +%Y%m%d_%H%M%S)/
[ -f src/styles/mobile.css ] && cp src/styles/mobile.css .backup/$(date +%Y%m%d_%H%M%S)/

# 4. Create directories
echo "📁 Creating directories..."
mkdir -p src/lib src/components src/features/models src/styles

# 5. File validation
echo "✅ Validating files..."
required_files=(
    "src/lib/theme.ts"
    "src/lib/presets.ts" 
    "src/lib/modelFilter.ts"
    "src/lib/autoSetup.ts"
    "src/components/PersonaPicker.tsx"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# 6. TypeScript Check
echo "🔧 TypeScript Check..."
if command -v tsc &> /dev/null; then
    if ! tsc --noEmit; then
        echo "❌ TypeScript Fehler gefunden"
        exit 1
    else
        echo "✅ TypeScript OK"
    fi
else
    echo "⚠️  TypeScript nicht gefunden - überspringe Check"
fi

# 7. Build Test
echo "🏗️  Build Test..."
if npm run build; then
    echo "✅ Build erfolgreich"
else
    echo "❌ Build fehlgeschlagen"
    exit 1
fi

# 8. Create .env.local template if not exists
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local template..."
    cat > .env.local << 'ENVEOF'
# OpenRouter API Key (get from https://openrouter.ai/keys)
# OPENROUTER_API_KEY=sk-or-your-key-here
ENVEOF
    echo "✅ .env.local template created"
fi

# 9. Update .gitignore
if ! grep -q ".env.local" .gitignore 2>/dev/null; then
    echo "🔧 Adding .env.local to .gitignore..."
    echo ".env.local" >> .gitignore
    echo "✅ .gitignore updated"
fi

echo ""
echo "🎉 Integration erfolgreich deployed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Trage deinen OpenRouter API-Key in .env.local ein"
echo "   2. Teste die Auto-Setup Funktionalität"
echo "   3. Customize Presets nach Bedarf"
echo ""
echo "🔗 Useful Commands:"
echo "   npm run dev     # Development server"
echo "   npm run build   # Production build"
echo "   npm run preview # Preview build"
echo ""
echo "📚 Documentation: siehe INTEGRATION.md"
echo ""
