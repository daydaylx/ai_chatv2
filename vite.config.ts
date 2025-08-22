import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Hinweis: Service Worker wird über VITE_SW_MODE gesteuert:
// - "on":    /sw.js registrieren
// - "kill":  /sw-kill.js registrieren
// - (leer):  kein Service Worker (Default)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      __SW_MODE__: JSON.stringify(env.VITE_SW_MODE ?? '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: 5173,
      strictPort: true
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
});
