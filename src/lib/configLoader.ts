export type JsonBlob = Record<string, unknown> | null;

async function fetchJSON(url: string): Promise<JsonBlob> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Lädt persona.json (Vorrang) oder modular: /config/models.json + /config/styles.json + /config/modelGroups.json; Fallback: /models.json + /styles.json */
export async function loadModularPersona(): Promise<Record<string, unknown> | null> {
  // 1) Vorrang: persona.json
  const persona = await fetchJSON("/persona.json");
  if (persona && typeof persona === "object") return persona;

  // 2) Modular
  const [modelsCfg, stylesCfg, groupsCfg] = await Promise.all([
    fetchJSON("/config/models.json"),
    fetchJSON("/config/styles.json"),
    fetchJSON("/config/modelGroups.json")
  ]);

  const models =
    (modelsCfg && Array.isArray((modelsCfg as any).models))
      ? (modelsCfg as any).models
      : (Array.isArray(modelsCfg) ? modelsCfg : null);

  const styles =
    (stylesCfg && Array.isArray((stylesCfg as any).styles))
      ? (stylesCfg as any).styles
      : (Array.isArray(stylesCfg) ? stylesCfg : null);

  const modelGroups =
    (groupsCfg && Array.isArray((groupsCfg as any).modelGroups))
      ? (groupsCfg as any).modelGroups
      : (Array.isArray(groupsCfg) ? groupsCfg : null);

  if (models || styles || modelGroups) {
    return { ...(models ? { models } : {}), ...(styles ? { styles } : {}), ...(modelGroups ? { modelGroups } : {}) };
  }

  // 3) Legacy
  const [legacyModels, legacyStyles] = await Promise.all([fetchJSON("/models.json"), fetchJSON("/styles.json")]);
  const legacyOut: Record<string, unknown> = {};
  if (legacyModels) legacyOut.models = Array.isArray((legacyModels as any).models) ? (legacyModels as any).models : (Array.isArray(legacyModels) ? legacyModels : []);
  if (legacyStyles) legacyOut.styles = Array.isArray((legacyStyles as any).styles) ? (legacyStyles as any).styles : (Array.isArray(legacyStyles) ? legacyStyles : []);
  if (legacyOut.models || legacyOut.styles) return legacyOut;

  return null;
}
