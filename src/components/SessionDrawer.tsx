import React from 'react';
import { useSession } from '../entities/session/store';

type Props = {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (id: string) => void;
};

export default function SessionDrawer({ open, onClose, onOpenChange, onSelect }: Props) {
  const sess = useSession();

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    else onClose?.();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-card border-r border-border transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="h-12 flex items-center justify-between px-3 border-b border-border">
        <h3 className="font-medium">Sessions</h3>
        <button className="px-2 py-1 rounded-md border hover:bg-accent" onClick={handleClose}>
          ✕
        </button>
      </div>
      <ul className="overflow-y-auto h-[calc(100%-3rem)]">
        {sess.sessions.map((s) => (
          <li key={s.id}>
            <button
              className={`w-full text-left px-3 py-2 border-b border-border hover:bg-accent ${
                s.id === sess.currentId ? 'bg-accent' : ''
              }`}
              onClick={() => onSelect?.(s.id)}
              title={s.title}
            >
              <div className="truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(s.updatedAt).toLocaleString()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
