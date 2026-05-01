import { notFound } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";
import { supabaseAdmin } from "@/lib/supabase";
import { mdToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

// Slug-Schema: <year>-kw<2digit>-<de|en>
function parseSlug(slug: string): {
  year: number;
  kw: number;
  language: "de" | "en";
} | null {
  const m = /^(\d{4})-kw(\d{1,2})-(de|en)$/.exec(slug);
  if (!m) return null;
  return {
    year: parseInt(m[1], 10),
    kw: parseInt(m[2], 10),
    language: m[3] as "de" | "en",
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const parsed = parseSlug(params.slug);
  if (!parsed) return { title: "Tracer Brief" };
  return {
    title: `Tracer Brief — KW ${parsed.kw}/${parsed.year} (${parsed.language.toUpperCase()})`,
  };
}

export default async function BriefIssuePage({
  params,
}: {
  params: { slug: string };
}) {
  const parsed = parseSlug(params.slug);
  if (!parsed) notFound();

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("brief_issue")
    .select("kw, year, language, final_md, draft_md, sent_at, status")
    .eq("kw", parsed.kw)
    .eq("year", parsed.year)
    .eq("language", parsed.language)
    .maybeSingle();

  if (error || !data) notFound();
  if (data.status !== "sent" && !process.env.NEXT_PUBLIC_PREVIEW_MODE) {
    notFound();
  }

  const md = (data.final_md as string | null) ?? (data.draft_md as string | null);
  if (!md) notFound();

  const html = mdToHtml(md);
  const sentAt = data.sent_at
    ? new Date(data.sent_at as string).toLocaleDateString("de-DE", {
        dateStyle: "long",
      })
    : null;

  return (
    <main className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <Link
            href="/brief"
            className="text-sm text-tracer hover:underline"
          >
            ← Brief
          </Link>
        </header>

        <p className="text-sm text-ink-900/50 mb-6">
          {sentAt} · KW {parsed.kw}, {parsed.year} ·{" "}
          {parsed.language.toUpperCase()}
        </p>

        <article
          className="prose-tracer"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-16 rounded-xl border border-ink-100 bg-ink-50 p-6 text-center">
          <p className="text-sm text-ink-900/70 mb-3">
            Nächste Ausgabe per Mail bekommen?
          </p>
          <Link
            href="/brief"
            className="rounded-lg bg-tracer hover:bg-tracer-dark text-white font-medium px-5 py-2.5 inline-block"
          >
            Abonnieren
          </Link>
        </div>
      </div>

      <style>{`
        .prose-tracer h1 { font-size: 1.875rem; font-weight: 600; font-family: ui-serif, Georgia, serif; margin-bottom: 1rem; line-height: 1.2; color: #0b0f15; }
        .prose-tracer h2 { font-size: 1.25rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; color: #0b0f15; }
        .prose-tracer h3 { font-size: 1.05rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #0b0f15; }
        .prose-tracer p  { margin: 0 0 1rem; color: #0b0f15; line-height: 1.7; }
        .prose-tracer a  { color: #0ea5a5; text-decoration: underline; }
        .prose-tracer hr { border: none; border-top: 1px solid #eceef2; margin: 2rem 0; }
        .prose-tracer strong { color: #0b0f15; font-weight: 600; }
        .prose-tracer em { font-style: italic; color: #0b0f15; }
      `}</style>
    </main>
  );
}
