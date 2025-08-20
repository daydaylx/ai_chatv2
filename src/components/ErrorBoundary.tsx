import * as React from "react";

type State = { error: Error | null };
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) { console.error("UI error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 m-3 rounded-xl border border-red-500/40 bg-red-500/10">
          <div className="font-semibold mb-1">Unerwarteter Fehler</div>
          <div className="text-sm opacity-80">{String(this.state.error.message || this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
