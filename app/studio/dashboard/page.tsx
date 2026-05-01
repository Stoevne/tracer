import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken, makeToken } from "@/lib/approve-token";
import { Wordmark } from "@/app/_components/Wordmark";

export const dynamic = "force-dynamic";

interface BrandRow {
  name: string;
  language: "de" | "en" | "both";
}

interface BriefRow {
  id: string;
  kw: number;
  year: number;
  language: "de" | "en";
  theme: string;
  status: string;
  image_url: string | null;
  prompt_used: string | null;
  error_message: string | null;
  created_at: string;
  approved_at: string | null;
}

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams: { customer?: string; t?: string };
}) {
  const customerId = searchParams.customer;
  const token = searchParams.t;
  if (!customerId || !token) notFound();
  if (!verifyToken("customer", customerId, token)) notFound();

  const supabase = supabaseAdmin();
  const [{ data: customer }, { data: brand }, { data: briefs }] = await Promise.all([
    supabase
      .from("customer")
      .select("id, email, subscription_status, subscription_tier")
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("brand_profile")
      .select("name, language")
      .eq("customer_id", customerId)
      .maybeSingle(),
    supabase
      .from("content_brief")
      .select(
        "id, kw, year, language, theme, status, image_url, prompt_used, error_message, created_at, approved_at",
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!customer) notFound();

  const settingsToken = makeToken("settings", customerId);
  const list = (briefs ?? []) as BriefRow[];
  const b = (brand ?? null) as BrandRow | null;

  return (
    <main className="min-h-screen bg-ink-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <div className="text-sm text-ink-900/60">
            <span>{customer.email as string}</span>
            {" · "}
            <Link
              href={`/studio/settings?customer=${customerId}&t=${settingsToken}`}
              className="text-tracer hover:underline"
            >
              Einstellungen
            </Link>
          </div>
        </header>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-ink-900 mb-1">
            {b?.name ?? "Studio Dashboard"}
          </h1>
          <p className="text-sm text-ink-900/60">
            Subscription:{" "}
            <span className="font-medium text-ink-900">
              {customer.subscription_tier as string | null ?? "—"}
            </span>{" "}
            ({customer.subscription_status as string})
            {" · "}
            {list.length} {list.length === 1 ? "Brief" : "Briefs"}
          </p>
        </div>

        {list.length === 0 ? (
          <p className="text-ink-900/60">
            Noch keine Briefs. Der wöchentliche Generation-Job läuft jeden
            Mittwoch 09:00 UTC.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {list.map((brief) => (
              <BriefCard key={brief.id} brief={brief} customerId={customerId} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function BriefCard({ brief, customerId: _ }: { brief: BriefRow; customerId: string }) {
  const created = new Date(brief.created_at).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const token = makeToken("brief_content", brief.id);
  const approveUrl = `/api/studio/approve?brief=${brief.id}&t=${token}`;
  const rejectUrl = `/api/studio/approve?brief=${brief.id}&t=${token}&action=reject`;

  return (
    <article className="rounded-xl border border-ink-100 bg-white overflow-hidden shadow-sm">
      {brief.image_url ? (
        <a
          href={brief.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-[1200/627] bg-ink-50"
        >
          <Image
            src={brief.image_url}
            alt={brief.theme}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized
          />
        </a>
      ) : (
        <div className="aspect-[1200/627] bg-ink-50 flex items-center justify-center text-ink-900/40 text-sm">
          {brief.status === "failed"
            ? "(Generierung fehlgeschlagen)"
            : "(noch kein Bild)"}
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={brief.status} />
          <span className="text-xs text-ink-900/60">
            KW {brief.kw}, {brief.year} · {brief.language.toUpperCase()}
          </span>
        </div>
        <h2 className="text-base font-medium text-ink-900 leading-snug">
          {brief.theme}
        </h2>
        {brief.error_message ? (
          <p className="text-sm text-red-600">{brief.error_message}</p>
        ) : null}
        {brief.status === "generated" || brief.status === "pending" ? (
          <div className="flex gap-2 pt-2">
            <a
              href={approveUrl}
              className="rounded-lg bg-tracer hover:bg-tracer-dark text-white text-sm font-medium px-3 py-1.5"
            >
              Freigeben
            </a>
            <a
              href={rejectUrl}
              className="rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-900 text-sm px-3 py-1.5"
            >
              Verwerfen
            </a>
          </div>
        ) : null}
        {brief.prompt_used ? (
          <details className="text-sm text-ink-900/70">
            <summary className="cursor-pointer text-ink-900/80 font-medium select-none">
              FLUX-Prompt
            </summary>
            <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-ink-900/70">
              {brief.prompt_used}
            </p>
          </details>
        ) : null}
        <p className="text-xs text-ink-900/40">{created}</p>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-ink-100 text-ink-900/60",
    generated: "bg-tracer/10 text-tracer",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    posted: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
  };
  const cls = styles[status] ?? "bg-ink-100 text-ink-900/60";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
