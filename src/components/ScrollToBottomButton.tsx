import React from "react";

interface Props {
  visible: boolean;
  onClick: () => void;
}

export default function ScrollToBottomButton({ visible, onClick }: Props) {
  return (
    <button
      className={`scroll-bottom ${visible ? "show" : ""}`}
      onClick={onClick}
      aria-label="Zum Ende scrollen"
    >
      <svg viewBox="0 0 24 24" className="icon">
        <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
