import React from 'react';
import { useSession } from '../../entities/session/store';

export type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string };

export default function ChatPanel() {
  const sess = useSession();
  const fullHistory: ChatMsg[] = sess.messages.map((m) => ({
    role: m.role,
    content: m.content
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md border bg-card p-3 max-h-[40vh] overflow-y-auto">
        {fullHistory.length === 0 ? (
          <div className="text-sm text-muted-foreground">Noch keine Nachrichten.</div>
        ) : (
          <ul className="space-y-2">
            {fullHistory.map((m, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{m.role}:</span> {m.content}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        className="w-full rounded-md border bg-background px-3 py-2"
        placeholder="Deine Nachricht…"
      />
    </div>
  );
}
