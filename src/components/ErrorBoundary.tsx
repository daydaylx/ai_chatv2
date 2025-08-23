import React, { Component, type ReactNode } from 'react';

type State = { hasError: boolean };

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { hasError: false };

  // Bei statischen Methoden kein 'override' verwenden.
  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: any) {
    console.error('UI error:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-md border bg-card text-foreground">
          <h2 className="text-lg font-semibold mb-1">Etwas ist schiefgelaufen</h2>
          <p className="text-sm text-muted-foreground">Bitte Seite neu laden.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
