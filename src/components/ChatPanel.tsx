import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatItem, Model, Preset } from '../types';
import { presets } from '../presets';
import MessageBubble from './MessageBubble';
import ChatComposer from './ChatComposer';
import PersonaPicker from './PersonaPicker';
import ModelPicker from './ModelPicker';

interface ChatPanelProps {
  items: ChatItem[];
  setItems: React.Dispatch<React.SetStateAction<ChatItem[]>>;
  selectedModel: Model;
  onModelChange: (model: Model) => void;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  items,
  setItems,
  selectedModel,
  onModelChange,
  isGenerating,
  setIsGenerating
}) => {
  const [userMsg, setUserMsg] = useState({ role: 'user' as const, content: '' });
  const [selectedPresetId, setSelectedPresetId] = useState('frech_direkt');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Preset aus localStorage laden
  useEffect(() => {
    const saved = localStorage.getItem('selectedPreset');
    if (saved && presets.find(p => p.id === saved)) {
      setSelectedPresetId(saved);
    }
  }, []);

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  // Preset-Änderung verwalten
  const handlePresetChange = useCallback((presetId: string) => {
    setSelectedPresetId(presetId);
    localStorage.setItem('selectedPreset', presetId);
    setShowPersonaPicker(false);
    
    // Optional: Chat-Historie löschen für sauberen Kontext
    const currentPreset = presets.find(p => p.id === presetId);
    if (currentPreset && items.length > 0) {
      const shouldClear = confirm(`Preset zu "${currentPreset.name}" geändert. Chat-Historie für sauberen Kontext löschen?`);
      if (shouldClear) {
        setItems([]);
      }
    }
  }, [items.length, setItems]);

  // Nachricht senden
  const sendMessage = useCallback(async () => {
    if (!userMsg.content.trim() || isGenerating) return;

    // Aktuellen Preset holen
    const currentPreset = presets.find(p => p.id === selectedPresetId) || presets[0];
    const systemMessage = { role: "system" as const, content: currentPreset.system };
    
    // User-Message zu Chat hinzufügen
    const newUserMsg: ChatItem = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg.content,
      timestamp: new Date()
    };
    
    setItems(prev => [...prev, newUserMsg]);
    setUserMsg({ role: 'user', content: '' });
    setIsGenerating(true);

    // Messages für API vorbereiten (mit System-Prompt)
    const messagesWithSystem = [
      systemMessage,
      ...items.map(({ role, content }) => ({ role, content })),
      { role: "user", content: newUserMsg.content }
    ];

    console.log('Sending with preset:', currentPreset.name);
    console.log('System prompt active:', currentPreset.system.substring(0, 100) + '...');

    // AbortController für Abbruch-Funktionalität
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesWithSystem,
          model: selectedModel.id,
          stream: true,
          temperature: currentPreset.temperature || 0.7,
          max_tokens: currentPreset.maxTokens || 4000,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Streaming Response verarbeiten
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      let assistantMsg: ChatItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: selectedModel.name
      };

      setItems(prev => [...prev, assistantMsg]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const data = line.substring(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              assistantMsg.content += content;
              setItems(prev => 
                prev.map(item => 
                  item.id === assistantMsg.id 
                    ? { ...item, content: assistantMsg.content }
                    : item
                )
              );
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted by user');
        return;
      }
      
      console.error('Chat error:', error);
      
      const errorMsg: ChatItem = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ Fehler: ${error.message || 'Unbekannter Fehler beim Senden der Nachricht'}`,
        timestamp: new Date(),
        isError: true
      };
      
      setItems(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [userMsg.content, isGenerating, selectedPresetId, items, selectedModel, setItems, setIsGenerating]);

  // Generation abbrechen
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }, [setIsGenerating]);

  // Aktueller Preset für Anzeige
  const currentPreset = presets.find(p => p.id === selectedPresetId) || presets[0];

  return (
    <div className="chat-panel">
      {/* Header mit Preset und Model Info */}
      <div className="chat-header">
        <button 
          className="preset-button"
          onClick={() => setShowPersonaPicker(true)}
          title={`Aktiver Prompt: ${currentPreset.name}`}
        >
          <span className="preset-emoji">{currentPreset.emoji}</span>
          <span className="preset-name">{currentPreset.name}</span>
        </button>
        
        <button 
          className="model-button"
          onClick={() => setShowModelPicker(true)}
          title={`Aktives Model: ${selectedModel.name}`}
        >
          {selectedModel.name}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="messages-container">
        {items.map((item) => (
          <MessageBubble key={item.id} message={item} />
        ))}
        {isGenerating && (
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatComposer
        value={userMsg.content}
        onChange={(content) => setUserMsg({ role: 'user', content })}
        onSend={sendMessage}
        onStop={stopGeneration}
        disabled={isGenerating}
        isGenerating={isGenerating}
        placeholder={`Nachricht an ${currentPreset.name}...`}
      />

      {/* Modals */}
      {showPersonaPicker && (
        <PersonaPicker
          presets={presets}
          selectedId={selectedPresetId}
          onSelect={handlePresetChange}
          onClose={() => setShowPersonaPicker(false)}
        />
      )}

      {showModelPicker && (
        <ModelPicker
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          onClose={() => setShowModelPicker(false)}
        />
      )}
    </div>
  );
};

export default ChatPanel;
