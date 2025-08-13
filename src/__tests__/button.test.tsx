import React from "react";
import ReactDOMServer from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Button } from "../shared/ui/Button";

describe("Button", () => {
  it("rendert seinen Inhalt", () => {
    const html = ReactDOMServer.renderToString(<Button>Klick</Button>);
    expect(html).toContain("Klick");
  });

  it("setzt Variant-Klassen (primary)", () => {
    const html = ReactDOMServer.renderToString(<Button variant="primary">OK</Button>);
    // Grobe Prüfung auf eine der Variant-Klassen
    expect(html).toMatch(/bg-primary/);
  });
});
