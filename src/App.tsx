import { useEffect, useMemo, useState } from 'react';
import { ModelPicker } from './features/models/ModelPicker';
import { OpenRouterClient } from './lib/openrouter';
import PersonaPicker from './components/PersonaPicker';
import { PRESETS, type PersonaPreset } from './lib/presets';
import { autoSetup } from './lib/autoSetup';
import { applyTheme, type ThemeId } from './lib/theme';
import ThemePicker from './features/settings/ThemePicker';
import './styles/mobile.css';

export default function App() {
  const client = useMemo(() => new OpenRouterClient(), []);
  const [modelId, setModelId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showPersona, setShowPersona] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<PersonaPreset | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('dark');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(client.getApiKey());
    // Load saved preset
    const savedPresetId = localStorage.getItem('persona_preset_id');
    if (savedPresetId) {
      const preset = PRESETS.find(p => p.id === savedPresetId);
      if (preset) setCurrentPreset(preset);
    }
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as ThemeId;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, [client]);

  const handleAutoSetup = (preset: PersonaPreset) => {
    const result = autoSetup(preset, {
      setPresetId: (id) => setCurrentPreset(PRESETS.find(p => p.id === id) || null),
      setModel: setModelId,
      setThemeId: (id) => {
        setCurrentTheme(id);
        applyTheme(id);
      },
      setShowPersona,
      setError,
      onSuccess: (p) => {
        console.log('Auto-Setup erfolgreich:', p);
      }
    });
    
    if (result.success) {
      const changes = [];
      if (result.changes.persona) changes.push('Stil');
      if (result.changes.model) changes.push('Modell');
      if (result.changes.theme) changes.push('Theme');
      
      if (changes.length > 0) {
        alert(`✅ Auto-Setup erfolgreich!\n\nAngepasst: ${changes.join(', ')}`);
      }
    } else if (result.errors.length > 0) {
      alert(`⚠️ Auto-Setup teilweise fehlgeschlagen:\n\n${result.errors.join('\n')}`);
    }
  };

  const handlePresetChange = (id: string) => {
    const preset = PRESETS.find(p => p.id === id);
    if (preset) {
      setCurrentPreset(preset);
      localStorage.setItem('persona_preset_id', id);
    }
    setShowPersona(false);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <strong>AI Chat PWA</strong>
        </div>
        <div className="topbar__right">
          <button 
            className="btn" 
            onClick={() => setShowPersona(true)}
            title="Stil auswählen"
          >
            🎭 {currentPreset?.label || 'Stil'}
          </button>
          <button 
            className="btn" 
            onClick={() => setShowTheme(true)}
            title="Theme wählen"
          >
            🎨
          </button>
        </div>
      </header>

      <main className="chat" style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h1>AI Chat Mobile PWA</h1>

        {error && (
          <div className="banner error">
            {error}
          </div>
        )}

        <section style={{ margin: '12px 0' }}>
          <label style={{ display: 'block', fontWeight: 600 }}>OpenRouter API Key</label>
          <input
            className="input"
            type="password"
            placeholder="sk-or-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button 
              className="btn"
              onClick={() => { 
                client.setApiKey(apiKey); 
                alert('Key gespeichert (localStorage).'); 
              }}
            >
              Speichern
            </button>
            <button 
              className="btn danger"
              onClick={() => { 
                client.clearApiKey(); 
                setApiKey(''); 
                alert('Key gelöscht.'); 
              }}
            >
              Löschen
            </button>
          </div>
        </section>

        <section style={{ margin: '12px 0' }}>
          <h2 style={{ margin: '8px 0' }}>Model auswählen</h2>
          <ModelPicker value={modelId} onChange={setModelId} client={client} />
          {modelId && (
            <p style={{ marginTop: 8 }}>
              Aktives Modell: <code>{modelId}</code>
            </p>
          )}
        </section>

        {currentPreset && (
          <section style={{ margin: '12px 0' }}>
            <h3>Aktueller Stil</h3>
            <p><strong>{currentPreset.label}</strong></p>
            <p style={{ fontSize: '14px', color: '#8b949e' }}>{currentPreset.desc}</p>
            <p style={{ fontSize: '12px', marginTop: 8 }}>
              Content-Level: <span className={`content-level ${currentPreset.contentLevel}`}>
                {currentPreset.contentLevel}
              </span>
            </p>
          </section>
        )}
      </main>

      <PersonaPicker
        visible={showPersona}
        currentId={currentPreset?.id}
        currentModel={modelId}
        currentTheme={currentTheme}
        onChange={handlePresetChange}
        onAutoSetup={handleAutoSetup}
        onClose={() => setShowPersona(false)}
      />

      <ThemePicker
        visible={showTheme}
        value={currentTheme}
        onChange={(id) => {
          setCurrentTheme(id);
          applyTheme(id);
          localStorage.setItem('theme', id);
          setShowTheme(false);
        }}
        onClose={() => setShowTheme(false)}
      />
    </div>
  );
}
