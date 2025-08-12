import { useEffect, useMemo, useState } from 'react';
import './index.css';
import ChatPanel from './features/chat/ChatPanel';
import { listModels, OpenRouterModel } from './lib/openrouter';

function useLocalStorage(key: string, initial: string) {
const [val, setVal] = useState(() => {
try {
const v = localStorage.getItem(key);
return v !== null ? v : initial;
} catch { return initial; }
});
useEffect(() => {
try { localStorage.setItem(key, val); } catch {}
}, [key, val]);
return [val, setVal] as const;
}

export default function App() {
// API-Key: UI > localStorage > .env (Client liest .env via lib)
const [apiKey, setApiKey] = useLocalStorage('openrouter_api_key', '');
const [models, setModels] = useState<OpenRouterModel[]>([]);
const [modelId, setModelId] = useLocalStorage('model_id', 'openrouter/auto');

const [loadingModels, setLoadingModels] = useState(false);
const [err, setErr] = useState<string | null>(null);

useEffect(() => {
const ctrl = new AbortController();
setLoadingModels(true);
setErr(null);
listModels(ctrl.signal)
.then(setModels)
.catch(e => setErr(e instanceof Error ? e.message : String(e)))
.finally(() => setLoadingModels(false));
return () => ctrl.abort();
}, [apiKey]); // beim Key-Wechsel neu laden

// Fallback: falls gewähltes Modell nicht verfügbar, auf auto
useEffect(() => {
if (!models.length) return;
const exists = models.some(m => m.id === modelId);
if (!exists) setModelId('openrouter/auto');
}, [models, modelId, setModelId]);

const modelOptions = useMemo(() => {
const base = [{ id: 'openrouter/auto', name: 'openrouter/auto (automatisch)' }];
const rest = models.map(m => ({ id: m.id, name: m.name ?? m.id }));
return [...base, ...rest];
}, [models]);

return (
<div className="app">
<header className="header">
<h1>AI Chat v2</h1>
<span className="badge" title="Nur privat/lokal verwenden">PRIVATE BUILD</span>
<div className="spacer" />
<input
className="input"
type="password"
placeholder="OpenRouter API-Key"
value={apiKey}
onChange={(e) => setApiKey(e.target.value)}
style={{ width: 280 }}
/>
<select
className="select"
value={modelId}
onChange={(e) => setModelId(e.target.value)}
style={{ maxWidth: 340 }}
disabled={loadingModels}
title={loadingModels ? 'Lade Modelle…' : 'Modell wählen'}
>
{modelOptions.map(m => (
<option key={m.id} value={m.id}>{m.name}</option>
))}
</select>
<button className="button secondary" onClick={() => location.reload()}>
Neu laden
</button>
</header>

php-template
Kopieren
Bearbeiten
  <main className="main">
    <ChatPanel model={modelId} />
  </main>

  <footer className="footer">
    {err ? <span className="err">Fehler Modelle: {err}</span> : (
      <span>Tip: API-Key im Header setzen. Enter = senden, Shift+Enter = Zeilenumbruch.</span>
    )}
  </footer>
</div>
);
}
