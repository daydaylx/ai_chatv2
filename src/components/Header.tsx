import React from "react";

interface Props {
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({ title = "AI Chat", onMenuClick }: Props) {
  return (
    <header className="app-header">
      <button
        className="icon-button"
        aria-label="Menü öffnen"
        onClick={onMenuClick}
      >
        <svg viewBox="0 0 24 24" className="icon">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="header-title" aria-live="polite">{title}</div>
      <div className="header-spacer" />
    </header>
  );
}
