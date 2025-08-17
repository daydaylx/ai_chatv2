import { describe, expect, it } from "vitest";
import { useSettings } from "../entities/settings/store";

describe("settings store", () => {
  it("hat Defaults und Setter funktionieren (null/strings)", () => {
    const s = useSettings.getState() as any;
    expect(s.modelId).toBeNull();
    expect(s.personaId).toBe("neutral");
    s.setModelId(null);
    s.setPersonaId(null);
    expect(s.modelId).toBeNull();
    expect(s.personaId).toBeNull();
  });

  it("setzt gültige Werte", () => {
    const s = useSettings.getState() as any;
    s.setModelId("openai/gpt-4");
    s.setPersonaId("neutral");
    expect(s.modelId).toBe("openai/gpt-4");
    expect(s.personaId).toBe("neutral");
  });

  it("überschreibt wieder mit null", () => {
    const s = useSettings.getState() as any;
    s.setModelId("openai/gpt-4");
    s.setPersonaId("neutral");
    s.setModelId(null);
    s.setPersonaId(null);
    expect(s.modelId).toBeNull();
    expect(s.personaId).toBeNull();
  });
});
