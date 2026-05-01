import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";
import { TIERS, TIER_DETAILS } from "@/lib/stripe";

export const metadata = {
  title: "Pricing — Tracer Studio",
  description:
    "Drei Tarife für Tracer Studio: Solo, Praxis, Team. 14 Tage Trial.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <nav className="flex gap-6 text-sm text-ink-900/70">
            <Link href="/brief" className="hover:text-ink-900">
              Tracer Brief
            </Link>
            <Link href="/studio/onboarding" className="hover:text-ink-900">
              Onboarding
            </Link>
          </nav>
        </header>

        <section className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ink-900 mb-4">
            Wähle deinen Plan
          </h1>
          <p className="text-ink-900/70 max-w-2xl mx-auto">
            14 Tage Trial. Jederzeit kündbar. Alle Preise zzgl. USt.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((t) => {
            const d = TIER_DETAILS[t];
            const highlight = t === "praxis";
            return (
              <div
                key={t}
                className={`rounded-xl border p-6 bg-white ${
                  highlight
                    ? "border-tracer shadow-md"
                    : "border-ink-100 shadow-sm"
                }`}
              >
                {highlight ? (
                  <p className="text-xs font-medium uppercase tracking-wider text-tracer mb-2">
                    Empfohlen
                  </p>
                ) : null}
                <h2 className="text-xl font-semibold text-ink-900 mb-1">
                  {d.label}
                </h2>
                <p className="text-3xl font-serif font-semibold text-ink-900 mb-1">
                  {d.priceEur} €
                  <span className="text-base text-ink-900/50 font-normal">
                    {" "}
                    /Mo
                  </span>
                </p>
                <ul className="text-sm text-ink-900/80 space-y-2 my-6">
                  {d.perks.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-tracer">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <form
                  action="/api/stripe/checkout"
                  method="post"
                  className="space-y-3"
                >
                  <input type="hidden" name="tier" value={t} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="dein@beispiel.de"
                    className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-tracer"
                  />
                  <button
                    type="submit"
                    className={`w-full rounded-lg font-medium px-4 py-2.5 transition ${
                      highlight
                        ? "bg-tracer hover:bg-tracer-dark text-white"
                        : "border border-ink-100 hover:bg-ink-100 text-ink-900"
                    }`}
                  >
                    14 Tage testen
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-ink-900/40 text-center mt-10">
          Zahlungsabwicklung über Stripe. Du erhältst eine Quittung per Mail.
        </p>
      </div>
    </main>
  );
}
