import React, { Component } from "react";
import type { ReactNode } from "react";

type State = {
  hasError: boolean;
  message?: string;
};

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  // Kein 'override' hier, da die React-Typen diese statische Signatur nicht als override-berechtigt markieren
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Lokal loggen; für Privatgebrauch ausreichend
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="min-h-[40vh] w-full grid place-items-center p-6 text-center bg-background text-foreground"
        >
          <div className="max-w-prose space-y-3">
            <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen.</h1>
            <p className="text-sm opacity-80">
              {this.state.message ?? "Unbekannter Fehler"}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center h-11 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
              onClick={() => this.setState({ hasError: false, message: undefined })}
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
