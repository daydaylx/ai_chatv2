import { useState, useEffect } from 'react';
import { loadPersonaData, getModelsForStyle, type PersonaData, type PersonaStyle } from './api';

export default function App() {
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [currentStyle, setCurrentStyle] = useState<PersonaStyle | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [loading, setLoading] = useState(true);

  // Load persona data on mount
  useEffect(() => {
    loadPersonaData().then(data => {
      setPersonaData(data);

      // Set default style
      const savedStyleId = localStorage.getItem('current_style_id');
      const defaultStyle = savedStyleId
        ? data.styles.find(s => s.id === savedStyleId) || data.styles[0]
        : data.styles[0];
      setCurrentStyle(defaultStyle || null);

      // Set default model (use saved or first allowed for the style)
      const savedModelId = localStorage.getItem('current_model_id');
      let defaultModel: string;
      if (savedModelId && data.models.some(m => m.id === savedModelId)) {
        defaultModel = savedModelId;
      } else {
        const allowedModels = defaultStyle ? getModelsForStyle(data.models, defaultStyle) : data.models;
        defaultModel = allowedModels[0]?.id || '';
      }
      setCurrentModel(defaultModel);

      setLoading(false);
    });
  }, []);

  // Save current selections to localStorage
  useEffect(() => {
    if (currentStyle) {
      localStorage.setItem('current_style_id', currentStyle.id);
    }
  }, [currentStyle]);

  useEffect(() => {
    if (currentModel) {
      localStorage.setItem('current_model_id', currentModel);
    }
  }, [currentModel]);

  useEffect(() => {
    localStorage.setItem('openrouter_api_key', apiKey);
  }, [apiKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Lade Persona-Daten...</div>
      </div>
    );
  }

  if (!personaData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Fehler beim Laden der Persona-Daten</div>
      </div>
    );
  }

  // Filter models based on current style (if any)
  const modelsForStyle = currentStyle ? getModelsForStyle(personaData.models, currentStyle) : personaData.models;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">AI Chat PWA</h1>
          
          <div className="flex items-center gap-4">
            {/* Style Selector */}
            <select
              value={currentStyle?.id || ''}
              onChange={(e) => {
                const style = personaData.styles.find(s => s.id === e.target.value);
                setCurrentStyle(style || null);
                // If current model is not allowed for new style, reset to first allowed
                if (style && !getModelsForStyle(personaData.models, style).some(m => m.id === currentModel)) {
                  const firstAllowed = getModelsForStyle(personaData.models, style)[0]?.id || '';
                  setCurrentModel(firstAllowed);
                }
              }}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1"
            >
              {personaData.styles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>

            {/* Model Selector */}
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1"
            >
              {modelsForStyle.map(model => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {/* Current Setup Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Aktuelle Konfiguration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Stil:</span>
              <span className="ml-2 font-medium">{currentStyle?.name || 'Keiner'}</span>
            </div>
            <div>
              <span className="text-gray-400">Modell:</span>
              <span className="ml-2 font-medium">
                {personaData.models.find(m => m.id === currentModel)?.label || 'Keines'}
              </span>
            </div>
          </div>
          
          {currentStyle && (
            <div className="mt-3">
              <span className="text-gray-400">System-Prompt:</span>
              <p className="mt-1 text-sm text-gray-300 bg-gray-700 p-2 rounded">
                {currentStyle.system}
              </p>
            </div>
          )}
        </div>

        {/* API Key Input */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">OpenRouter API Key</h2>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
          />
          <p className="text-sm text-gray-400 mt-1">
            API Key wird lokal gespeichert. Hol dir einen kostenlosen Key von{' '}
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              openrouter.ai
            </a>.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{personaData.styles.length}</div>
            <div className="text-sm text-gray-400">Stile verfügbar</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{personaData.models.length}</div>
            <div className="text-sm text-gray-400">Modelle verfügbar</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {personaData.styles.filter(s => s.id.includes('nsfw')).length}
            </div>
            <div className="text-sm text-gray-400">NSFW Stile</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {personaData.models.filter(m => m.tags?.includes('kostenlos')).length}
            </div>
            <div className="text-sm text-gray-400">Kostenlose Modelle</div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-center">
            Chat-Interface wird hier integriert...
          </p>
        </div>
      </main>
    </div>
  );
}
