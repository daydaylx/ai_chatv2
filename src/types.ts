export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  ts: number; // epoch ms
}

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: number;
  lastSnippet: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  provider?: string;
  context?: number;
}

export interface StyleTemplate {
  id: string;
  name: string;
  system: string;
}
