import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './registerSW'; // Kill-Switch/Unregister runs on import (side-effect)

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root-Element #root nicht gefunden. Prüfe index.html.');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
