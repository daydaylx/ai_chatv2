#!/bin/bash
set -e

echo "🚀 AI Chat Mobile PWA - Setup & Start"
echo "====================================="

# Cleanup
echo "🧹 Cleaning up old files..."
rm -rf node_modules dist .vite
rm -f package-lock.json tsconfig.tsbuildinfo

# Install
echo "📦 Installing dependencies..."
npm install

# Type check
echo "✅ Type checking..."
npm run typecheck || echo "⚠️  Type errors found, continuing..."

# Build
echo "🏗️  Building project..."
npm run build

# Start
echo "🎉 Starting development server..."
npm run dev
