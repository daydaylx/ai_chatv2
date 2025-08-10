import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

export default function SwUpdate() {
  const [show, setShow] = useState(false);
  const [updater, setUpdater] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: false,
      onNeedRefresh() {
        setUpdater(() => updateSW);
        setShow(true);
      },
      onRegistered() {
        // noop
      },
      onRegisterError(err) {
        console.error("SW register failed:", err);
      }
    });
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", left: 12, right: 12, bottom: 14, zIndex: 50,
      background: "#0f141b", border: "1px solid #1b2430", color: "#e6edf3",
      borderRadius: 12, padding: 12, display: "flex", gap: 8, alignItems: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.45)"
    }}>
      <div style={{ fontWeight: 700 }}>Neue Version verfügbar</div>
      <div style={{ flex: 1, color: "#a0aab6", fontSize: 13 }}>Tippe „Neu laden“, um zu aktualisieren.</div>
      <button
        className="btn"
        onClick={() => { updater?.(true); }}
        aria-label="Neu laden"
      >Neu laden</button>
      <button
        className="btn danger"
        onClick={() => setShow(false)}
        aria-label="Später"
      >Später</button>
    </div>
  );
}
