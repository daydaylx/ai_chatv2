import React from 'react';
import { useSession } from '../entities/session/store';

type Props = {
  onOpenSettings?: () => void;
  onOpenSessions?: () => void;
};

export default function Header({ onOpenSettings, onOpenSessions }: Props) {
  const sess = useSession();
  const title =
    sess.sessions.find((s) => s.id === sess.currentId)?.title ?? 'Disa AI';

  return (
    <header className="h-12 flex items-center justify-between px-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 rounded-md border hover:bg-accent"
          onClick={onOpenSessions}
          aria-label="Sessions öffnen"
          title="Sessions"
        >
          ☰
        </button>
        <h1 className="font-semibold truncate">{title}</h1>
      </div>
      <button
        className="px-2 py-1 rounded-md border hover:bg-accent"
        onClick={onOpenSettings}
        aria-label="Einstellungen"
        title="Einstellungen"
      >
        ⚙
      </button>
    </header>
  );
}
