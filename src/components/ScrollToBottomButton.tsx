import React from "react";
import Button from "../shared/ui/Button";

export default function ScrollToBottomButton({ onClick, visible }: { onClick: ()=>void; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed right-3 bottom-[88px]">
      <Button variant="solid" size="icon" onClick={onClick} aria-label="Zum Ende scrollen">↓</Button>
    </div>
  );
}
