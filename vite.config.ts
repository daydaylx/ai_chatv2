applypatch <<'PATCH'
*** Begin Patch
*** Update File: vite.config.ts
@@
     VitePWA({
       registerType: "autoUpdate",
       selfDestroying: true,
       devOptions: {
         enabled: false,
       },
-      manifest: {
-        name: "AI Chat",
-        short_name: "AI Chat",
-        start_url: "/",
-        display: "standalone",
-        background_color: "#0b0b0b",
-        theme_color: "#0b0b0b",
-        icons: [
-          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
-          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
-          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
-        ],
-      },
+      manifest: {
+        name: "AI Chat",
+        short_name: "AI Chat",
+        start_url: "/",
+        display: "standalone",
+        background_color: "#0b0b0b",
+        theme_color: "#0b0b0b",   // <— Pflicht für „Installieren“-Prompt
+        icons: [
+          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
+          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
+          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
+        ]
+      }
*** End Patch
PATCH

