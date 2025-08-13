import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { OpenRouterModel } from "../../lib/openrouter";
import { OpenRouterClient } from "../../lib/openrouter";
import { getPresetById, isModelAllowedByPreset } from "../../lib/presets";
import clsx from "clsx";

/**
 * WICHTIG:
 * Diese Komponente liest – wenn möglich – Modelle aus src/data/personas.json.
 * Unterstützte Schemata:
 *  A) Top-Level-Objekt:
 *     {
 *       "models": [ { "id": "...", "name"/"label": "...", "context_length"/"context": 8192, "input_price": 0.0, "output_price": 0.0 } ],
 *       "personas": [ ... ]
 *     }
 *  B) Top-Level-Array (dein bisheriger Stil), plus ein Eintrag mit { "models": [...] }:
 *     [
 *       { "id": "neutral", ... },
 *       ...,
 *       { "id": "$models", "models": [ { "id": "...", ... } ] }
 *     ]
 */

import raw from "../../data/personas.json";

type Props = {
  value: string;
  onChange: (id: string) => void;
  client: OpenRouterClient;
  personaId?: string;
};

function coerceNumber(n: any): number | undefined {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

function extractStaticModels(anyRaw: any): OpenRouterModel[] {
  try {
    // Schema A: Objekt mit "models"
    if (anyRaw && typeof anyRaw === "object" && !Array.isArray(anyRaw) && Array.isArray((anyRaw as any).models)) {
      const arr = (anyRaw as any).models as any[];
      return arr
        .map((m) => {
          const id = String(m?.id ?? "").trim();
          if (!id) return null;
          const name = (m?.label ?? m?.name ?? id ?? "").toString().trim();
          const context = coerceNumber(m?.context_length ?? m?.context);
          const input_price = typeof m?.input_price === "number" ? m.input_price : undefined;
          const output_price = typeof m?.output_price === "number" ? m.output_price : undefined;
          return { id, name, context_length: context, input_price, output_price, pricing: (m as any)?.pricing };
        })
        .filter(Boolean) as OpenRouterModel[];
    }
    // Schema B: Array mit einem Eintrag, der "models" enthält
    if (Array.isArray(anyRaw)) {
      const node = anyRaw.find((x) => x && typeof x === "object" && Array.isArray((x as any).models));
      if (node) {
        const arr = (node as any).models as any[];
        return arr
          .map((m) => {
            const id = String(m?.id ?? "").trim();
            if (!id) return null;
            const name = (m?.label ?? m?.name ?? id ?? "").toString().trim();
            const context = coerceNumber(m?.context_length ?? m?.context);
            const input_price = typeof m?.input_price === "number" ? m.input_price : undefined;
            const output_price = typeof m?.output_price === "number" ? m.output_price : undefined;
            return { id, name, context_length: context, input_price, output_price, pricing: (m as any)?.pricing };
          })
          .filter(Boolean) as OpenRouterModel[];
      }
    }
  } catch {
    // ignore parse/shape errors – wir fallen dann auf API zurück
  }
  return [];
}

export function ModelPicker({ value, onChange, client, personaId }: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [source, setSource] = useState<"static" | "api" | "none">("none");

  const preset = useMemo(() => getPresetById(personaId), [personaId]);

  useEffect(() => {
    let mounted = true;
    // 1) Versuch: statische Modelle aus personas.json
    const staticModels = extractStaticModels(raw as any);
    if (staticModels.length > 0) {
      if (mounted) {
        setModels(staticModels);
        setSource("static");
      }
      return () => { mounted = false; };
    }
    // 2) Fallback: OpenRouter-API
    (async () => {
      try {
        const list = await client.listModels();
        if (mounted) {
          setModels(list);
          setSource("api");
        }
      } catch (e) {
        console.error("[ModelPicker] Modelle nicht ladbar:", e);
        if (mounted) {
          setModels([]);
          setSource("none");
        }
      }
    })();
    return () => { mounted = false; };
  }, [client]);

  /** Modelle mit Kompatibilitätskennzeichnung (allow/deny vom Preset) */
  const withCompat = useMemo(
    () =>
      (models ?? []).map((m) => {
        const id = (m.id ?? "").trim();
        const allowed = id ? isModelAllowedByPreset(preset, id) : false;
        return { model: m, id, allowed };
      }),
    [models, preset]
  );

  /** Ist das aktuell gewählte Modell kompatibel zum aktiven Stil? */
  const currentAllowed = useMemo(() => {
    const id = value ?? "";
    return id ? isModelAllowedByPreset(preset, id) : true;
  }, [preset, value]);

  return (
    <div className="space-y-3">
      <select
        className={clsx(
          "w-full px-4 py-3 rounded-lg text-sm transition-all appearance-none cursor-pointer",
          "bg-secondary/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Modell wählen"
      >
        <option value="">— Modell wählen —</option>
        {withCompat.map(({ model: m, id, allowed }, idx) => {
          const base = (m.name ?? id) || "Unbenanntes Modell";
          const ctx = m.context_length ? ` · ${m.context_length}` : "";
          const label = base + ctx + (!allowed ? " (inkompatibel)" : "");
          return (
            <option
              key={id || m.name || `m-${idx}`}
              value={id}
              disabled={!allowed || !id}
            >
              {label}
            </option>
          );
        })}
      </select>

      <div className="text-xs text-muted-foreground">
        Quelle: {source === "static" ? "personas.json" : source === "api" ? "OpenRouter API" : "—"}
      </div>

      {!currentAllowed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-warn bg-warn/10 p-3 rounded-lg border border-warn/20"
        >
          Das aktuelle Modell ist mit dem gewählten Stil nicht kompatibel.
        </motion.div>
      )}
    </div>
  );
}
