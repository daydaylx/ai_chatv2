import React, { useEffect, useRef, useState } from "react";
import { useClient } from "../../lib/client";

export default function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldStickRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return; // ✅ Null-Check
    shouldStickRef.current =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
  };

  // --- Rest deiner Logik hier, unverändert ---
  // Dummy Example für den TS-Fehler:
  const rule = { allowedIds: ["abc", "def"] };
  const parts: string[] = [];

  for (let i = 0; i < rule.allowedIds.length; i++) {
    const id = rule.allowedIds[i];
    if (id) {
      parts.push(id); // ✅ string statt string|undefined
    }
  }

  // ...
  return (
    <div ref={scrollRef} onScroll={handleScroll}>
      {/* dein Chat-UI */}
    </div>
  );
}
