import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      manifest: false,
      devOptions: { enabled: true }
    })
  ],
  css: {
    // erzwingt lokale PostCSS-Config und verhindert Lookup bis $HOME
    postcss: "./postcss.config.cjs"
  },
  server: { host: true, port: 5173 },
  build: { target: "es2020", sourcemap: false }
});
