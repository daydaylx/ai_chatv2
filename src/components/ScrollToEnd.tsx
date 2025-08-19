import React from "react";

export function ScrollToEnd({ target }: { target: React.RefObject<HTMLElement|null> }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const el = target.current;
    if (!el) return;
    const onScroll = () => {
      // zeig den Button, wenn wir >1 Viewporthöhe vom Ende weg sind
      const delta = el.scrollHeight - el.clientHeight - el.scrollTop;
      setShow(delta > el.clientHeight * 0.8);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [target]);

  if (!show) return null;

  return (
    <button
      onClick={() => {
        const el = target.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight + 9999, behavior: "smooth" });
      }}
      className="fixed right-3 bottom-[76px] z-40 h-11 px-3 rounded-full text-sm border border-1 bg-[hsl(var(--surface-2)/0.9)] backdrop-blur hover:bg-accent-soft"
      aria-label="Zum Ende scrollen"
    >
      ↓ Zum Ende
    </button>
  );
}
