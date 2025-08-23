import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

<<<<<<< HEAD
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      selfDestroying: true,   // installierbar, kein Offline-Caching
      devOptions: { enabled: false },
      manifest: {
        name: "Disa AI",
        short_name: "DisaAI",
        start_url: "/",
        display: "standalone",
        background_color: "#111827",
        theme_color: "#111827",
        description: "Private AI Chat PWA",
        icons: [
          { src: "/icons/icon-48.png",  sizes: "48x48",   type: "image/png" },
          { src: "/icons/icon-72.png",  sizes: "72x72",   type: "image/png" },
          { src: "/icons/icon-96.png",  sizes: "96x96",   type: "image/png" },
          { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ]
=======
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
>>>>>>> origin/main
});
