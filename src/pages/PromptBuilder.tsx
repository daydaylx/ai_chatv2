import React from "react";
import type { StylePreset } from "@/types";
import { loadPresets } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useSearchParams } from "react-router-dom";

export default function PromptBuilder() {
  const [params] = useSearchParams();
  const [presets, setPresets] = React.useState<StylePreset[]>(() => loadPresets());
  const [selectedId, setSelectedId] = React.useState<string | null>(() => params.get("styleId"));
  const [goal, setGoal] = React.useState("");
  const [context, setContext] = React.useState("");
  const [constraints, setConstraints] = React.useState("Antworte auf Deutsch. Keine Floskeln. Nenne Risiken und Edge-Cases.");
  const [result, setResult] = React.useState("");

  React.useEffect(() => {
    // Falls keine Presets vorhanden, nachladen (z.B. erste Nutzung)
    if (presets.length === 0) {
      const stored = loadPresets();
      setPresets(stored);
    }
  }, []);

  const selected = presets.find((p) => p.id === selectedId) ?? presets[0];

  function build() {
    if (!selected) {
      alert("Bitte zuerst einen Stil auswählen oder anlegen.");
      return;
    }
    const parts = [
      `# System-Stil\n${selected.systemPrompt}`,
      `\n# Ziel\n${goal.trim() || "- (nicht angegeben)"}`,
      `\n# Kontext\n${context.trim() || "- (nicht angegeben)"}`,
      `\n# Zusätzliche Vorgaben\n${constraints.trim() || "- (keine)"}`
    ];
    setResult(parts.join("\n"));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      alert("Kopiert.");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Kopiert (Fallback).");
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Prompt-Builder</h2>
          <p className="muted">Kombiniere Stil, Ziel, Kontext und Vorgaben</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="muted text-sm">Stil</label>
          <select
            className="input"
            value={selected?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Textarea
            label="Ziel"
            placeholder="Was soll erreicht werden?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <Textarea
            label="Kontext"
            placeholder="Relevante Fakten, Einschränkungen, Beispiel-Eingaben…"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <Textarea
            label="Vorgaben (Constraints)"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
          />
          <Button onClick={build}>Prompt bauen</Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Ergebnis</h3>
            <Button variant="secondary" onClick={copy} disabled={!result}>Kopieren</Button>
          </div>
          <pre className="panel p-4 whitespace-pre-wrap min-h-[240px]">{result || "Noch kein Ergebnis. Fülle links die Felder aus und klicke auf „Prompt bauen“."}</pre>
          {selected && (
            <div className="panel p-4">
              <h4 className="font-medium mb-2">Aktiver Stil</h4>
              <div className="text-sm">
                <div><strong>Name:</strong> {selected.name}</div>
                <div><strong>Temp/top_p:</strong> {selected.temperature} / {selected.topP}</div>
                {selected.description && <div className="muted mt-1">{selected.description}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
