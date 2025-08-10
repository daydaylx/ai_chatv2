#!/bin/bash
set -e

echo "======================================"
echo "AI Chat Mobile PWA - Clean Build"
echo "======================================"

# Cleanup
echo "[1/5] Cleaning up old files..."
rm -rf node_modules dist .vite
rm -f package-lock.json tsconfig.tsbuildinfo

# Install
echo "[2/5] Installing dependencies..."
npm install

# Type check
echo "[3/5] Type checking..."
if npm run typecheck; then
    echo "Type check successful!"
else
    echo "Warning: Type errors found, continuing..."
fi

# Build
echo "[4/5] Building project..."
npm run build

echo "[5/5] Build complete!"
echo ""
echo "To start development: npm run dev"
echo "To preview production: npm run preview"
