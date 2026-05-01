import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";

export const metadata = {
  title: "Über Tracer",
  description:
    "Wer hinter Tracer steht und warum wir Editorial-Automation für Radiologie und Bildgebung bauen.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
        </header>

        <h1 className="text-4xl font-serif font-semibold text-ink-900 mb-6">
          Warum Tracer.
        </h1>

        <div className="prose space-y-4 text-ink-900/80 leading-relaxed">
          <p>
            Radiologen und Nuklearmediziner haben gute Inhalte — sie haben nur
            keine Zeit, sie zu verpacken. LinkedIn-Sichtbarkeit für Praxen und
            MedTech-Firmen wird wichtiger, aber niemand will den Mittwochabend
            mit Caption-Brainstorming verbringen.
          </p>
          <p>
            <strong className="text-ink-900">Tracer Studio</strong> übernimmt
            das. Ein Brand-Profil, ein wöchentlicher Rhythmus — die Maschine
            generiert, du gibst frei. Bilder sind editorial, nicht
            Stockfoto-Kitsch. CI bleibt deine.
          </p>
          <p>
            <strong className="text-ink-900">Tracer Brief</strong> ist der
            Newsletter, den wir selbst gerne lesen würden. Wöchentliche
            Kuration, klar getrennt nach DE/EN, ohne PR-Druck.
          </p>
          <p className="border-l-2 border-tracer pl-4 text-ink-900/70">
            Gebaut von PD Dr. Stephan Ellmann (Radiologe, RNZ Nürnberg) — als
            Werkzeug, das wir zuerst selbst genutzt haben, bevor wir es anderen
            anbieten.
          </p>
        </div>

        <div className="mt-12 flex gap-3">
          <Link
            href="/pricing"
            className="rounded-lg bg-tracer hover:bg-tracer-dark text-white font-medium px-5 py-3"
          >
            Studio testen
          </Link>
          <Link
            href="/brief"
            className="rounded-lg border border-ink-100 hover:bg-white text-ink-900 font-medium px-5 py-3"
          >
            Brief abonnieren
          </Link>
        </div>
      </div>
    </main>
  );
}
