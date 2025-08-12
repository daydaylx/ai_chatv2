import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vite-Konfiguration mit PWA (injectManifest) – sicher, konservatives Caching
export default defineConfig({
plugins: [
react(),
VitePWA({
registerType: 'autoUpdate',
strategies: 'injectManifest',
srcDir: 'src',
filename: 'sw.js',
injectRegister: 'auto',
workbox: undefined, // bei injectManifest NICHT setzen
manifest: {
name: 'AI Chat v2',
short_name: 'AI Chat',
description: 'Private Chat-UI für OpenRouter (nur lokal/privat).',
theme_color: '#0f172a',
background_color: '#0b1220',
display: 'standalone',
start_url: '/',
scope: '/',
icons: [
{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
{ src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
]
}
})
],
build: {
sourcemap: true,
rollupOptions: {
output: {
manualChunks: {
react: ['react', 'react-dom'],
}
}
}
},
server: {
port: 5173,
host: true,
}
});
