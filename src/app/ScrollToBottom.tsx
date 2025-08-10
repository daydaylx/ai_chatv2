import { useEffect, useState } from "react";

export default function ScrollToBottom() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("main.chat");
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      setShow(!atBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      className="fab"
      aria-label="Zum neuesten Beitrag"
      onClick={() => {
        const el = document.querySelector<HTMLElement>("main.chat");
        el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }}
    >↓</button>
  );
}
