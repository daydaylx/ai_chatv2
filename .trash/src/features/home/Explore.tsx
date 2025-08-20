import { memo } from "react";

type Props = {
  onPick: (text: string, send?: boolean) => void;
  modelLabel?: string;
  personaLabel?: string;
};

const QUICK: string[] = [
  "Erkläre mir das Konzept von Rust in einfachen Worten.",
  "Schreibe eine professionelle E-Mail, um einen Termin zu verschieben.",
  "Fasse folgenden Text in drei Bulletpoints zusammen:",
  "Brainstorme 5 Namen für eine App zur Haushaltsplanung.",
];

const CATEGORIES: { title: string; samples: string[] }[] = [
  {
    title: "Schreiben",
    samples: [
      "Korrigiere meinen Absatz grammatikalisch und stilistisch.",
      "Erstelle eine 3-Punkt Gliederung für …",
      "Formuliere eine neutrale Antwort auf …",
    ],
  },
  {
    title: "Lernen",
    samples: [
      "Erkläre mir Quantenverschränkung mit einer Analogie.",
      "Quizze mich zu HTTP-Statuscodes (10 Fragen).",
      "Gib mir eine Schritt-für-Schritt-Lösung für …",
    ],
  },
  {
    title: "Produktion",
    samples: [
      "Schreibe mir eine Bash-One-Liner-Lösung für …",
      "Erstelle eine JSON-Struktur für …",
      "Skizziere eine Teststrategie (Given/When/Then) für …",
    ],
  },
];

function Explore({ onPick, modelLabel, personaLabel }: Props) {
  return (
    <section className="container-mobile density-compact py-5 space-y-5">
      {/* Hero */}
      <div className="glass-heavy rounded-2xl p-5 overflow-hidden relative">
        <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
        <h1 className="fluid-hero font-semibold text-gradient">Was kann ich für dich tun?</h1>
        <p className="fluid-sub opacity-80 mt-1">
          {personaLabel ? <>Stil: <span className="font-medium">{personaLabel}</span> — </> : null}
          {modelLabel ? <>Modell: <span className="font-medium">{modelLabel}</span></> : "Wähle ein Modell in den Einstellungen."}
        </p>

        {/* Quick Chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK.map((q, i) => (
            <button
              key={i}
              className="chip whitespace-nowrap"
              onClick={() => onPick(q)}
              title={q}
            >
              ✨ {q.length > 40 ? q.slice(0, 40) + "…" : q}
            </button>
          ))}
        </div>

        <p className="text-xs opacity-70 mt-3">
          Tipp: <span className="kbd">Shift</span> + <span className="kbd">Enter</span> für Zeilenumbruch · <span className="kbd">Enter</span> zum Senden
        </p>
      </div>

      {/* Kategorien */}
      <div className="grid grid-cols-1 gap-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.title} className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase opacity-80">{cat.title}</h3>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {cat.samples.map((s, idx) => (
                <button
                  key={idx}
                  className="text-left px-3 py-3 rounded-xl bg-secondary/60 border border-white/10 hover:bg-secondary/70"
                  onClick={() => onPick(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-xs opacity-60">
        Tippe unten deine Nachricht oder wähle eine Vorlage.
      </div>
    </section>
  );
}

export default memo(Explore);
