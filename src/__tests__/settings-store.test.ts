import { describe, expect, it, beforeEach } from "vitest";
import { useSettings } from "../entities/settings/store";

describe("settings store", () => {
  beforeEach(() => {
    useSettings.getState().reset();
  });

  it("hat korrekte Defaults", () => {
    const s = useSettings.getState();
    expect(s.modelId).toBeUndefined();
    expect(s.personaId).toBe("neutral");
  });

  it("setzt gültige Werte", () => {
    const s = useSettings.getState() as any;
    s.setModelId("openai/gpt-4");
    s.setPersonaId("assistant");
    expect(s.modelId).toBe("openai/gpt-4");
    expect(s.personaId).toBe("assistant");
  });

  it("setzt undefined-Werte", () => {
    const s = useSettings.getState() as any;
    s.setModelId("openai/gpt-4");
    s.setPersonaId("assistant");
    s.setModelId(undefined);
    s.setPersonaId(undefined);
    expect(s.modelId).toBeUndefined();
    expect(s.personaId).toBeUndefined();
  });
});
