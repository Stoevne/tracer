import { SubscribeForm } from "@/app/_components/SubscribeForm";
import { Wordmark } from "@/app/_components/Wordmark";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full">
        <Wordmark className="text-tracer mb-12" />

        <h1 className="text-4xl md:text-5xl font-serif font-semibold leading-tight mb-6 text-ink-900">
          Editorial Automation für Radiologie, Nuklearmedizin & Bildgebung.
        </h1>

        <p className="text-lg text-ink-900/70 mb-10 leading-relaxed">
          <strong className="font-semibold text-ink-900">Tracer Studio</strong>{" "}
          generiert wöchentliche LinkedIn-Editorials für Praxen und MedTech-Firmen.{" "}
          <strong className="font-semibold text-ink-900">Tracer Brief</strong>{" "}
          kuratiert die wichtigsten Trends in KI und Bildgebung — jeden Montag,
          in deutscher und englischer Sprache.
        </p>

        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wider text-tracer mb-2">
            Coming soon
          </p>
          <p className="text-ink-900/80 mb-5">
            Wir öffnen demnächst die Beta. Trag dich für Tracer Brief ein und
            sei dabei, sobald Tracer Studio live geht.
          </p>

          <SubscribeForm />

          <p className="mt-4 text-xs text-ink-900/50">
            Wir versenden ausschließlich Tracer Brief und produktbezogene
            Updates. Kein Spam, jederzeit abbestellbar.
          </p>
        </div>

        <footer className="mt-16 flex items-center justify-between text-xs text-ink-900/50">
          <span>© {new Date().getFullYear()} Tracer</span>
          <span>Imprint coming soon</span>
        </footer>
      </div>
    </main>
  );
}
