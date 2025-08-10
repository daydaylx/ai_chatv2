#!/bin/bash
set -e

echo "🔧 Cleaning up..."
rm -rf node_modules package-lock.json .vite dist

echo "📦 Installing dependencies..."
npm install

echo "✅ Type checking..."
npm run typecheck

echo "🏗️ Building project..."
npm run build

echo "✨ Build successful!"
echo ""
echo "To start development server: npm run dev"
echo "To preview production build: npm run preview"
