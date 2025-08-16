#!/bin/bash
set -e

echo "Testing OpenRouter file integrity..."
if grep -q '\\;' src/lib/openrouter.ts 2>/dev/null; then
    echo "ERROR: Backslash found in openrouter.ts - fixing..."
    sed -i 's/\\;//g' src/lib/openrouter.ts
fi

echo "Running type check..."
npm run typecheck

if [ $? -eq 0 ]; then
    echo "SUCCESS: No type errors!"
    echo "Building project..."
    npm run build
    echo "Starting dev server..."
    npm run dev
else
    echo "Type errors found, but continuing..."
    npm run dev
fi
