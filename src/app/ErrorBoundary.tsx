import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; info?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const info = (error instanceof Error) ? `${error.name}: ${error.message}` : String(error);
    this.setState({ info });
    // Keine sensiblen Daten in Logs
    console.warn("[ErrorBoundary]", error);
  }

  handleReload = () => {
    this.setState({ hasError: false, info: undefined });
    location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100dvh",
          background: "#0b0f14",
          color: "#e6edf3",
          padding: "16px",
          display: "grid",
          placeItems: "center"
        }}>
          <div style={{ maxWidth: 520 }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>Unerwarteter Fehler</h1>
            <p style={{ opacity: .8, fontSize: "14px", lineHeight: 1.5 }}>
              Etwas ist schiefgelaufen. Kein Datenverlust: Die App kann sicher neu geladen werden.
            </p>
            {this.state.info && (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: .7, padding: "8px", background: "#0f141b", borderRadius: 8 }}>
                {this.state.info}
              </pre>
            )}
            <button onClick={this.handleReload} style={{
              marginTop: 12, width: "100%", padding: "12px 14px",
              background: "#1a73e8", border: 0, borderRadius: 12, color: "white", fontWeight: 600
            }}>
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
