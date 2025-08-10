import { useRef, useState } from "react";
import { exportBackup, importBackup, wipeAll } from "../../lib/db";
import { clearApiKey } from "../../lib/storage";

type Props = {
  visible: boolean;
  onClose: () => void;
};

async function wipeCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

export default function Backup({ visible, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  if (!visible) return null;

  async function handleExport() {
    setBusy(true);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-chat-backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const txt = await file.text();
      const json = JSON.parse(txt);
      await importBackup(json);
      alert("Backup importiert. App wird neu geladen.");
      location.reload();
    } catch (err) {
      alert(`Import fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleWipe() {
    if (!confirm("Alle lokalen Daten löschen (Chats, Einstellungen, API-Key, Caches)?")) return;
    setBusy(true);
    try {
      await wipeAll();
      clearApiKey();
      await wipeCaches();
      alert("Daten gelöscht. App wird neu geladen.");
      location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__panel">
        <div className="sheet__header">
          <strong>Backup & Datenschutz</strong>
          <button className="btn" onClick={onClose} aria-label="Schließen">Schließen</button>
        </div>

        <div className="sheet__body">
          <div className="group">
            <button className="btn" onClick={handleExport} disabled={busy}>Backup exportieren (JSON)</button>
          </div>

          <div className="group">
            <input ref={inputRef} className="file" type="file" accept="application/json" onChange={handleImport} disabled={busy} />
          </div>

          <div className="group">
            <button className="btn danger" onClick={handleWipe} disabled={busy}>🧨 Panik-Wipe (Alles löschen)</button>
            <div className="muted" style={{marginTop: 6}}>Löscht Chats (Dexie), Einstellungen, API-Key und SW-Caches.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
