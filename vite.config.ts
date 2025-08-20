/** Was & Warum:
 * Entfernt CSS/PostCSS-Overrides: Vite nimmt automatisch postcss.config.js (unsere "eine" Wahrheit).
 * PWA-Strategie A: Installierbar ohne Offline-Caching (selfDestroyingSW).
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      selfDestroyingSW: true, // kein SW-Caching -> keine "Geister"-Versionen
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "AI Chat",
        short_name: "AI Chat",
        start_url: "/",
        display: "standalone",
        background_color: "#0b0b0b",
        theme_color: "#0b0b0b",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
      },
    }),
  ],
  // Kein css.postcss Override hier! -> Vite nutzt automatisch ./postcss.config.js
  build: {
    sourcemap: false,
    target: "esnext",
  },
  server: {
    strictPort: true,
  },
});
