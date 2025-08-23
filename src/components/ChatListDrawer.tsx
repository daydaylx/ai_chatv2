import React from 'react';
import type { ChatSummary } from '../types'; // type-only import

type Props = {
  open: boolean;
  items: ChatSummary[];
  onSelect?: (id: string) => void;
  onClose?: () => void;
};

export default function ChatListDrawer({ open, items, onSelect, onClose }: Props) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-card border-r border-border transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-hidden={!open}
      aria-label="Chat Liste"
    >
      <div className="h-12 flex items-center justify-between px-3 border-b border-border">
        <h3 className="font-medium">Chats</h3>
        <button
          className="px-2 py-1 rounded-md border hover:bg-accent"
          onClick={onClose}
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-3rem)]">
        {items.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">Noch keine Chats.</div>
        ) : (
          <ul>
            {items.map((c) => (
              <li key={c.id}>
                <button
                  className="w-full text-left px-3 py-2 border-b border-border hover:bg-accent"
                  onClick={() => onSelect?.(c.id)}
                  title={c.title}
                >
                  <div className="truncate">{c.title}</div>
                  {c.updatedAt ? (
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleString()}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
