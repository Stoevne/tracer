import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";
import { SponsorForm } from "@/app/_components/SponsorForm";

export const metadata = {
  title: "Sponsor — Tracer Brief",
  description:
    "Buche einen Sponsored Slot in der nächsten Tracer-Brief-Ausgabe.",
};

export default function SponsorPage({
  searchParams,
}: {
  searchParams: { cancel?: string };
}) {
  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <Link href="/brief" className="text-sm text-tracer hover:underline">
            ← zurück zum Newsletter
          </Link>
        </header>

        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-ink-900 mb-3">
          Sponsored Slot in Tracer Brief
        </h1>
        <p className="text-ink-900/70 mb-8 leading-relaxed">
          Tracer Brief erreicht Radiologen, Nuklearmediziner und MedTech-Verantwortliche
          im DACH-Raum. Slots werden klar als „Anzeige&ldquo; gekennzeichnet,
          stehen prominent in der Mitte der Ausgabe und sind redaktionell sauber
          getrennt.
        </p>

        {searchParams.cancel ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            Buchung abgebrochen. Du kannst es jederzeit erneut versuchen.
          </div>
        ) : null}

        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <SponsorForm />
        </div>

        <p className="text-xs text-ink-900/40 mt-6 text-center">
          Slots in der nächsten Ausgabe — Buchung über Stripe, Rechnung folgt
          per Mail.
        </p>
      </div>
    </main>
  );
}
