import { defineConfig } from 'vitest/config';

// WICHTIG: KEIN @vitejs/plugin-react hier einbinden,
// sonst kollidieren die Vite-Typen von Vitest & Projekt.

export default defineConfig({
  test: {
    environment: 'jsdom',
    css: true,
    globals: true,
    setupFiles: ['./vitest.setup.ts']
  }
});
