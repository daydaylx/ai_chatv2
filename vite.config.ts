import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Service Worker Steuerung via VITE_SW_MODE:
//  - "on"   => /sw.js registrieren
//  - "kill" => /sw-kill.js registrieren (einmalige Bereinigung)
//  - ""     => kein SW (Default)

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
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true }
  };
});
