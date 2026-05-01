import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";

export const metadata = {
  title: "Profil angelegt — Tracer Studio",
};

export default function OnboardingSuccessPage() {
  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Wordmark className="text-tracer mb-10" />

        <div className="rounded-xl border border-tracer/40 bg-tracer/5 p-8">
          <p className="text-sm font-medium uppercase tracking-wider text-tracer mb-2">
            Profil angelegt
          </p>
          <h1 className="text-2xl font-serif font-semibold text-ink-900 mb-3">
            Wir haben dein Brand-Profil.
          </h1>
          <p className="text-ink-900/80 leading-relaxed mb-6">
            Sobald deine Subscription aktiv ist, generieren wir wöchentlich ein
            CI-konformes LinkedIn-Editorial für euch. Ein Probebild bekommst du
            per Mail, sobald es fertig ist.
          </p>
          <div className="flex gap-3">
            <Link
              href="/pricing"
              className="rounded-lg bg-tracer hover:bg-tracer-dark text-white font-medium px-5 py-3 transition"
            >
              Subscription wählen
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-ink-100 hover:bg-ink-100 text-ink-900 font-medium px-5 py-3 transition"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
