import { globAny } from "./glob";

export type ContextPolicy = {
  summaryModelId: string;
  reserveOutputRatio: number;
  reserveOutputRatioReasoning: number;
  summaryCapRatio: number;
  rawTurns: number;
  turnThreshold: number;
  tokenThresholdRatio: number;
};

type PolicyFile = {
  default: ContextPolicy;
  overrides?: Record<string, Partial<ContextPolicy>>;
};

const DEFAULTS: ContextPolicy = {
  summaryModelId: "qwen/qwen3-coder:free",
  reserveOutputRatio: 0.20,
  reserveOutputRatioReasoning: 0.33,
  summaryCapRatio: 0.15,
  rawTurns: 16,
  turnThreshold: 12,
  tokenThresholdRatio: 0.5
};

let cached: PolicyFile | null = null;

export async function loadContextPolicy(): Promise<ContextPolicy & { _overrides?: Record<string, Partial<ContextPolicy>> }> {
  if (cached) return { ...cached.default, _overrides: cached.overrides };
  try {
    const res = await fetch("/config/contextPolicy.json", { cache: "no-cache" });
    if (res.ok) {
      const body = await res.json();
      cached = normalizePolicyFile(body);
      return { ...cached.default, _overrides: cached.overrides };
    }
  } catch {}
  return { ...DEFAULTS };
}

function normalizePolicyFile(x: any): PolicyFile {
  const d = x?.default ?? {};
  const out: PolicyFile = {
    default: {
      summaryModelId: String(d.summaryModelId ?? DEFAULTS.summaryModelId),
      reserveOutputRatio: Number(d.reserveOutputRatio ?? DEFAULTS.reserveOutputRatio),
      reserveOutputRatioReasoning: Number(d.reserveOutputRatioReasoning ?? DEFAULTS.reserveOutputRatioReasoning),
      summaryCapRatio: Number(d.summaryCapRatio ?? DEFAULTS.summaryCapRatio),
      rawTurns: Number(d.rawTurns ?? DEFAULTS.rawTurns),
      turnThreshold: Number(d.turnThreshold ?? DEFAULTS.turnThreshold),
      tokenThresholdRatio: Number(d.tokenThresholdRatio ?? DEFAULTS.tokenThresholdRatio)
    },
    overrides: {}
  };
  if (x?.overrides && typeof x.overrides === "object") out.overrides = x.overrides;
  return out;
}

export function policyForModel(base: ContextPolicy & { _overrides?: Record<string, Partial<ContextPolicy>> }, modelId: string): ContextPolicy {
  const o = base._overrides ?? {};
  for (const pat of Object.keys(o)) {
    if (globAny([pat], modelId)) {
      return { ...base, ...o[pat] };
    }
  }
  return base;
}
