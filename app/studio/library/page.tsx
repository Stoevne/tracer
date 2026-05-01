import { notFound } from "next/navigation";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Brief {
  id: string;
  customer_id: string | null;
  kw: number;
  year: number;
  language: "de" | "en";
  theme: string;
  status: string;
  image_url: string | null;
  image_storage_path: string | null;
  prompt_used: string | null;
  error_message: string | null;
  created_at: string;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const expected = process.env.CRON_SECRET;
  if (!expected || searchParams.key !== expected) {
    notFound();
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("content_brief")
    .select(
      "id, customer_id, kw, year, language, theme, status, image_url, image_storage_path, prompt_used, error_message, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="min-h-screen bg-ink-50 p-8">
        <h1 className="text-2xl font-semibold mb-4 text-ink-900">
          Studio Library — Fehler beim Laden
        </h1>
        <pre className="text-sm text-red-600 whitespace-pre-wrap">
          {error.message}
        </pre>
      </div>
    );
  }

  const briefs = (data ?? []) as Brief[];

  return (
    <div className="min-h-screen bg-ink-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-baseline justify-between mb-8">
          <h1 className="text-2xl font-semibold text-ink-900">
            Studio Library
          </h1>
          <span className="text-sm text-ink-900/60">
            {briefs.length} {briefs.length === 1 ? "Brief" : "Briefs"}
          </span>
        </header>

        {briefs.length === 0 ? (
          <p className="text-ink-900/60">
            Noch keine Briefs. Trigger einen via{" "}
            <code className="bg-ink-100 px-1.5 py-0.5 rounded text-sm">
              POST /api/studio/generate
            </code>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {briefs.map((b) => (
              <BriefCard key={b.id} brief={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefCard({ brief }: { brief: Brief }) {
  const created = new Date(brief.created_at).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
          <span className="text-xs text-ink-900/40">
            {brief.customer_id
              ? `customer:${brief.customer_id.slice(0, 8)}`
              : "inline"}
          </span>
        </div>

        <h2 className="text-base font-medium text-ink-900 leading-snug">
          {brief.theme}
        </h2>

        {brief.error_message ? (
          <p className="text-sm text-red-600 whitespace-pre-wrap">
            {brief.error_message}
          </p>
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
