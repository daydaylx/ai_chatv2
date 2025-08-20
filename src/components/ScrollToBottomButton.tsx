import * as React from "react";
import Button from "../shared/ui/Button";

type Props = {
  onClick: () => void;
};

export default function ScrollToBottomButton({ onClick }: Props) {
  return (
    <div className="fixed right-3 bottom-16 sm:bottom-6 z-40 drop-shadow">
      <Button variant="solid" size="icon" onClick={onClick} aria-label="Zum Ende scrollen">
        ↓
      </Button>
    </div>
  );
}
