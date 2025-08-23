import React from 'react';
import { loadPersonas } from '@/services/personaService';
import type { Persona } from '@/types/models';
import ModelPicker from '@/components/ModelPicker';

export default function App() {
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadPersonas();
      setPersonas(data);
      setLoading(false);
      // Autoselect: erstes Modell, falls vorhanden
      const first = data.flatMap(p => p.models ?? [])[0];
      if (first) setSelectedModel(first.id);
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow">
        <h1 className="text-2xl font-semibold mb-1">AI Chat V2</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Mobile-optimierte Basis mit stabilen Tokens. Eingaben sind in Light/Dark gut lesbar.
        </p>

        <div className="space-y-4">
          <section>
            <h2 className="text-base font-medium mb-2">Modell auswählen</h2>
            {loading ? (
              <div className="rounded-md border p-4 bg-card text-sm text-muted-foreground">
                Modelle werden geladen …
              </div>
            ) : (
              <ModelPicker
                personas={personas}
                value={selectedModel}
                onChange={setSelectedModel}
              />
            )}
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">Prompt</h2>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Eingabe testen – Placeholder ist sichtbar, Caret hat Kontrast"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
