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
      filename: "sw.js",         // <-- JS statt TS
      strategies: "injectManifest",
      manifest: false,
      devOptions: { enabled: true }
    })
  ],
  css: {
    postcss: "./postcss.config.cjs"
  },
  server: { host: true, port: 5173 },
  build: { target: "es2020", sourcemap: false }
});
