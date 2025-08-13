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
