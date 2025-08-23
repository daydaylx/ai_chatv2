// Fallback-Deklaration, damit tsc ohne Vite-Transform nicht meckert
declare const __SW_MODE__: string;

// Steuerung via VITE_SW_MODE:
//  - 'on'   => registriert /sw.js (minimal, kein Caching)
//  - 'kill' => registriert /sw-kill.js (einmalig Caches leeren & sich selbst abmelden)
//  - ''     => kein Service Worker (Default, stabil)
const SW_MODE = (typeof __SW_MODE__ !== 'undefined' ? __SW_MODE__ : '') as string;

if ('serviceWorker' in navigator) {
  if (SW_MODE === 'on') {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[SW] register error:', err);
    });
  } else if (SW_MODE === 'kill') {
    navigator.serviceWorker.register('/sw-kill.js').catch((err) => {
      console.error('[SW-KILL] register error:', err);
    });
  }
}
