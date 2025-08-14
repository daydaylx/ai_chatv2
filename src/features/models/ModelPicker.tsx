import { useEffect, useMemo, useState } from "react";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { getPresetById, isModelAllowedByPreset } from "../../lib/presets";
import clsx from "clsx";
// Statische Konfiguration – optional enthält sie "models"
import raw from "../../data/personas.json";

type Props = {
  /** Aktuell gewählte Modell-ID */
  value: string;
  /** Änderungshandler */
  onChange: (id: string) => void;
  /** OpenRouter-Client für Fallback auf API */
  client: OpenRouterClient;
  /** Aktive Persona-ID zum Filtern (allow/deny) */
  personaId?: string;
};

function asNumber(n: any): number | undefined {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

/** Extrahiert statische Modelle aus verschiedenen möglichen Schemas in personas.json */
function extractStaticModels(anyRaw: any): OpenRouterModel[] {
  try {
    // Schema A: Objekt mit "models"
    if (anyRaw && typeof anyRaw === "object" && !Array.isArray(anyRaw) && Array.isArray((anyRaw as any).models)) {
      return ((anyRaw as any).models as any[])
        .map((m) => {
          const id = String(m?.id ?? "").trim();
          if (!id) return null;
          const name = (m?.label ?? m?.name ?? id).toString();
          const context_length = asNumber(m?.context_length ?? m?.context);
          const input_price = typeof m?.input_price === "number" ? m.input_price : undefined;
          const output_price = typeof m?.output_price === "number" ? m.output_price : undefined;
          return { id, name, context_length, input_price, output_price, pricing: (m as any)?.pricing };
        })
        .filter(Boolean) as OpenRouterModel[];
    }
    // Schema B: Top-Level Array; finde Eintrag mit "models"
    if (Array.isArray(anyRaw)) {
      const node = anyRaw.find((x) => x && typeof x === "object" && Array.isArray((x as any).models));
      if (node) {
        return ((node as any).models as any[])
          .map((m) => {
            const id = String(m?.id ?? "").trim();
            if (!id) return null;
            const name = (m?.label ?? m?.name ?? id).toString();
            const context_length = asNumber(m?.context_length ?? m?.context);
            const input_price = typeof m?.input_price === "number" ? m.input_price : undefined;
            const output_price = typeof m?.output_price === "number" ? m.output_price : undefined;
            return { id, name, context_length, input_price, output_price, pricing: (m as any)?.pricing };
          })
          .filter(Boolean) as OpenRouterModel[];
      }
    }
  } catch {
    // Bei Parserfehlern: ignore -> Fallback auf API
  }
  return [];
}

export function ModelPicker({ value, onChange, client, personaId }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [source, setSource] = useState<"static" | "api" | "none">("none");

  const preset = useMemo(() => getPresetById(personaId), [personaId]);

  useEffect(() => {
    let mounted = true;

    // 1) Statisch aus personas.json?
    const statics = extractStaticModels(raw as any);
    if (statics.length > 0) {
      setModels(statics);
      setSource("static");
      return () => { mounted = false; };
    }

    // 2) Fallback: API
    (async () => {
      try {
        const list = await client.listModels();
        if (!mounted) return;
        setModels(list);
        setSource("api");
      } catch (e) {
        console.error("[ModelPicker] Modelle konnten nicht geladen werden:", e);
        if (!mounted) return;
        setModels([]);
        setSource("none");
      }
    })();

    return () => { mounted = false; };
  }, [client]);

  // Mit Kompatibilitätsstatus (allow/deny durch persona)
  const withCompat = useMemo(
    () =>
      (models ?? []).map((m) => {
        const id = (m.id ?? "").trim();
        const allowed = id ? isModelAllowedByPreset(preset, id) : false;
        return { model: m, id, allowed };
      }),
    [models, preset]
  );

  // Ist aktuell gewähltes Modell kompatibel?
  const currentAllowed = useMemo(() => {
    const id = value ?? "";
    return id ? isModelAllowedByPreset(preset, id) : true;
  }, [preset, value]);

  return (
    <div className="space-y-2">
      <select
        className={clsx(
          "w-full px-4 py-3 rounded-lg text-sm transition-all appearance-none cursor-pointer",
          "bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Modell wählen"
      >
        <option value="">— Modell wählen —</option>
        {withCompat.map(({ model: m, id, allowed }, idx) => {
          const base = (m.name ?? id) || "Modell";
          const ctx = m.context_length ? ` · ${m.context_length}` : "";
          return (
            <option key={id || m.name || `m-${idx}`} value={id} disabled={!allowed || !id}>
              {base + ctx + (!allowed ? " (inkompatibel)" : "")}
            </option>
          );
        })}
      </select>

      <div className="text-xs text-muted-foreground">
        Quelle: {source === "static" ? "personas.json" : source === "api" ? "OpenRouter API" : "—"}
      </div>

      {!currentAllowed && (
        <div className="text-sm text-yellow-300/90 bg-yellow-300/10 p-3 rounded-lg border border-yellow-300/20">
          Das aktuell gewählte Modell ist mit dem Stil nicht kompatibel.
        </div>
      )}
    </div>
  );
}
