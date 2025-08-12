export interface ChatItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  isError?: boolean;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  description?: string;
}

export interface Preset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  system: string;
  temperature: number;
  maxTokens: number;
  contentLevel: 'safe' | 'mature' | 'adult' | 'unlimited';
  features: string[];
  autoSetup?: {
    model?: string;
    temperature?: number;
  };
}

export type ContentLevel = 'safe' | 'mature' | 'adult' | 'unlimited';
