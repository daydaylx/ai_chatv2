import React from 'react';
import Header from '@/components/Header';
import SessionDrawer from '@/components/SessionDrawer';

type Props = {
  children?: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openSessions, setOpenSessions] = React.useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header
        onOpenSettings={() => setOpenSettings(true)}
        onOpenSessions={() => setOpenSessions(true)}
      />
      <main className="p-3">
        {children}
      </main>

      {/* Sessions */}
      <SessionDrawer open={openSessions} onOpenChange={setOpenSessions} />

      {/* Settings Placeholder-Panel (falls noch nicht implementiert) */}
      {openSettings && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={() => setOpenSettings(false)}
        >
          <div
            className="w-[90vw] max-w-lg rounded-lg border border-border bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Einstellungen</h2>
            <p className="text-sm text-muted-foreground">Noch nicht konfiguriert.</p>
            <div className="mt-4 text-right">
              <button
                className="px-3 py-2 rounded-md border hover:bg-accent"
                onClick={() => setOpenSettings(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
