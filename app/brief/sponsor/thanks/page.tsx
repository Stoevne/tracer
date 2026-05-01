import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";

export const metadata = {
  title: "Danke — Sponsored Slot gebucht",
};

export default function SponsorThanksPage() {
  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Wordmark className="text-tracer mb-10" />

        <div className="rounded-xl border border-tracer/40 bg-tracer/5 p-8">
          <p className="text-sm font-medium uppercase tracking-wider text-tracer mb-2">
            Slot gebucht
          </p>
          <h1 className="text-2xl font-serif font-semibold text-ink-900 mb-3">
            Danke für die Buchung.
          </h1>
          <p className="text-ink-900/80 leading-relaxed mb-6">
            Sobald die Zahlung bestätigt ist, geht der Slot in die nächste
            Ausgabe. Du bekommst nach Versand eine Reporting-Mail mit
            Open-Rate und Klicks.
          </p>
          <Link
            href="/brief"
            className="rounded-lg border border-ink-100 hover:bg-ink-100 text-ink-900 font-medium px-5 py-3 inline-block transition"
          >
            Zur Brief-Übersicht
          </Link>
        </div>
      </div>
    </main>
  );
}
