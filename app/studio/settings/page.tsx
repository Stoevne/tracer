import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken, makeToken } from "@/lib/approve-token";
import { Wordmark } from "@/app/_components/Wordmark";
import { SettingsForm } from "@/app/_components/SettingsForm";
import { PauseToggle } from "@/app/_components/PauseToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { customer?: string; t?: string };
}) {
  const customerId = searchParams.customer;
  const token = searchParams.t;
  if (!customerId || !token) notFound();
  if (!verifyToken("settings", customerId, token)) notFound();

  const supabase = supabaseAdmin();
  const [{ data: customer }, { data: brand }] = await Promise.all([
    supabase
      .from("customer")
      .select("id, email, paused_at, subscription_status")
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("brand_profile")
      .select("name, primary_color, tone, focus_areas, language, logo_url")
      .eq("customer_id", customerId)
      .maybeSingle(),
  ]);

  if (!customer) notFound();

  const settingsToken = token;
  const dashboardToken = makeToken("customer", customerId);

  return (
    <main className="min-h-screen bg-ink-50 py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <Link
            href={`/studio/dashboard?customer=${customerId}&t=${dashboardToken}`}
            className="text-sm text-tracer hover:underline"
          >
            ← Dashboard
          </Link>
        </header>

        <h1 className="text-2xl font-serif font-semibold text-ink-900 mb-2">
          Einstellungen
        </h1>
        <p className="text-sm text-ink-900/60 mb-8">{customer.email as string}</p>

        <section className="rounded-xl border border-ink-100 bg-white p-6 mb-6">
          <h2 className="text-base font-semibold text-ink-900 mb-4">
            Brand-Profil
          </h2>
          <SettingsForm
            customerId={customerId}
            token={settingsToken}
            initial={{
              name: (brand?.name as string) ?? "",
              primary_color: (brand?.primary_color as string) ?? "",
              tone: (brand?.tone as string) ?? "",
              focus_areas:
                (brand?.focus_areas as string[] | null)?.join(", ") ?? "",
              language: (brand?.language as "de" | "en" | "both") ?? "de",
              logo_url: (brand?.logo_url as string) ?? null,
            }}
          />
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-6 mb-6">
          <h2 className="text-base font-semibold text-ink-900 mb-2">Pause</h2>
          <p className="text-sm text-ink-900/60 mb-4">
            Pausiert die wöchentliche Generation, bis du sie wieder
            aktivierst. Dein Brand-Profil bleibt gespeichert.
          </p>
          <PauseToggle
            customerId={customerId}
            token={settingsToken}
            paused={Boolean(customer.paused_at)}
          />
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="text-base font-semibold text-ink-900 mb-2">
            Subscription verwalten
          </h2>
          <p className="text-sm text-ink-900/60 mb-4">
            Zahlungsmethode, Rechnungen, Tarif-Wechsel laufen über das
            Stripe-Portal.
          </p>
          <form action="/api/stripe/portal" method="post">
            <input
              type="hidden"
              name="email"
              value={customer.email as string}
            />
            <button
              type="submit"
              className="rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-900 px-4 py-2 text-sm"
            >
              Zum Stripe-Portal
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
