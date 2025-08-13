import React from "react";
import { ChatSummary } from "../types";

interface Props {
  open: boolean;
  chats: ChatSummary[];
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export default function ChatListDrawer({
  open,
  chats,
  onClose,
  onSelectChat,
  onNewChat,
  onOpenSettings,
}: Props) {
  return (
    <div className={`drawer ${open ? "open" : ""}`} role="dialog" aria-modal="true">
      <div className="drawer-header">
        <h2>Deine Chats</h2>
        <button className="icon-button" aria-label="Schließen" onClick={onClose}>
          <svg viewBox="0 0 24 24" className="icon">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="drawer-content">
        {chats.length === 0 && <div className="drawer-empty">Noch keine Konversationen.</div>}
        <ul className="chat-list">
          {chats.map((c) => (
            <li key={c.id}>
              <button className="chat-item" onClick={() => onSelectChat(c.id)}>
                <div className="chat-item-title">{c.title}</div>
                <div className="chat-item-snippet">{c.lastSnippet}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="drawer-footer">
        <button className="btn primary" onClick={onNewChat}>+ Neuer Chat</button>
        <button className="btn" onClick={onOpenSettings}>Einstellungen</button>
      </div>
    </div>
  );
}
