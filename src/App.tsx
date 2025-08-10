import { useEffect, useMemo, useState } from 'react';
import { ModelPicker } from './features/models/ModelPicker';
import { OpenRouterClient } from './lib/openrouter';

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [modelId, setModelId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    setApiKey(client.getApiKey());
  }, [client]);

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>AI Chat Mobile PWA</h1>

      <section style={{ margin: '12px 0' }}>
        <label style={{ display: 'block', fontWeight: 600 }}>OpenRouter API Key</label>
        <input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={() => { client.setApiKey(apiKey); alert('Key gespeichert (localStorage).'); }}>
            Speichern
          </button>
          <button onClick={() => { client.clearApiKey(); setApiKey(''); alert('Key gelöscht.'); }}>
            Löschen
          </button>
        </div>
      </section>

      <section style={{ margin: '12px 0' }}>
        <h2 style={{ margin: '8px 0' }}>Model auswählen</h2>
        <ModelPicker value={modelId} onChange={setModelId} client={client} />
        {modelId && <p style={{ marginTop: 8 }}>Aktives Modell: <code>{modelId}</code></p>}
      </section>
    </main>
  );
}
