import { beforeEach, describe, expect, it } from "vitest";
import { useSettings } from "../entities/settings/store";

/** Minimaler localStorage-Shim für Node-Umgebung. */
class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v));
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as any).localStorage = new LocalStorageMock();
  // Store zurücksetzen
  const s = (useSettings as any).getState() as ReturnType<typeof useSettings>;
  s.setModelId(null);
  s.setPersonaId(null);
});

describe("useSettings store", () => {
  it("persistiert modelId/personaId in localStorage", () => {
    const s = (useSettings as any).getState() as ReturnType<typeof useSettings>;
    s.setModelId("openai/gpt-4");
    s.setPersonaId("neutral");

    expect((globalThis as any).localStorage.getItem("model_id")).toBe("openai/gpt-4");
    expect((globalThis as any).localStorage.getItem("persona_id")).toBe("neutral");
    expect((useSettings as any).getState().modelId).toBe("openai/gpt-4");
    expect((useSettings as any).getState().personaId).toBe("neutral");
  });

  it("löscht Werte korrekt", () => {
    const s = (useSettings as any).getState() as ReturnType<typeof useSettings>;
    s.setModelId("openai/gpt-4");
    s.setPersonaId("neutral");

    s.setModelId(null);
    s.setPersonaId(null);

    expect((globalThis as any).localStorage.getItem("model_id")).toBe(null);
    expect((globalThis as any).localStorage.getItem("persona_id")).toBe(null);
    expect((useSettings as any).getState().modelId).toBe(null);
    expect((useSettings as any).getState().personaId).toBe(null);
  });
});
