import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="container py-6 space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <h3 className="section-title">Stile</h3>
          <p className="muted mt-1">Verwalte Systemprompt-Stile, Parameter und Tags.</p>
          <Link to="/styles" className="btn btn-primary mt-3 inline-flex">Öffnen</Link>
        </div>
        <div className="card p-5">
          <h3 className="section-title">Prompt-Builder</h3>
          <p className="muted mt-1">Kombiniere Stil + Ziel + Kontext. Kopierfertig.</p>
          <Link to="/builder" className="btn btn-primary mt-3 inline-flex">Öffnen</Link>
        </div>
        <div className="card p-5">
          <h3 className="section-title">Einstellungen</h3>
          <p className="muted mt-1">Theme, Dichte und Basis-Optionen.</p>
          <Link to="/settings" className="btn btn-primary mt-3 inline-flex">Öffnen</Link>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="section-title">Hinweis</h3>
        <p className="muted">
          Diese UI ist auf klare Hierarchie, gute Lesbarkeit und mobile Bedienung optimiert.
          Keine Spielereien, keine Überraschungen – Fokus auf zuverlässige Bedienung.
        </p>
      </section>
    </div>
  );
}
