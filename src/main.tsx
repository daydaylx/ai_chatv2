/**
 * Vite/React Entry.
 * - Fix: createRoot(...).render(<App />) statt leerem Render-Call.
 * - Harte Prüfung auf #root für klare Fehlermeldungen.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root-Element #root nicht gefunden. Prüfe index.html.');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
