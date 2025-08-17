// Basis Chat-Message Interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Erweiterte Chat-Message mit Metadaten
export interface ExtendedChatMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  modelUsed?: string;
  styleUsed?: string;
}

// Persona Style Definition
export interface PersonaStyle {
  id: string;
  name: string;
  system: string;
  allow?: string[];
  deny?: string[];
}

// Model Definition
export interface PersonaModel {
  id: string;
  label: string;
  tags?: string[];
  context?: number;
}

// Komplette Persona-Daten
export interface PersonaData {
  models: PersonaModel[];
  styles: PersonaStyle[];
}

// App State
export interface AppState {
  currentStyle: PersonaStyle | null;
  currentModel: string;
  apiKey: string;
  chatHistory: ExtendedChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error Types
export interface APIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}
