import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";
import { SubscribeForm } from "@/app/_components/SubscribeForm";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata = {
  title: "Tracer Brief — Newsletter zu KI in der Bildgebung",
  description:
    "Wöchentlich, DE/EN: Was sich in Radiologie, Nuklearmedizin und MedTech bewegt. Kuratiert, kein Spam.",
};

export const dynamic = "force-dynamic";

interface IssueRow {
  id: string;
  kw: number;
  year: number;
  language: "de" | "en";
  sent_at: string | null;
}

export default async function BriefLandingPage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("brief_issue")
    .select("id, kw, year, language, sent_at")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(8);

  const issues = (data ?? []) as IssueRow[];

  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <nav className="flex gap-6 text-sm text-ink-900/70">
            <Link href="/brief/archive" className="hover:text-ink-900">
              Archiv
            </Link>
            <Link href="/brief/sponsor" className="hover:text-ink-900">
              Sponsor
            </Link>
          </nav>
        </header>

        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ink-900 mb-6">
          Tracer Brief
        </h1>
        <p className="text-lg text-ink-900/70 mb-8 leading-relaxed">
          Jeden Montag um 06:00. KI, Bildgebung, MedTech — kuratiert von Ärzten,
          nicht von einem Marketing-Team. Deutsch oder Englisch.
        </p>

        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm mb-12">
          <SubscribeForm />
          <p className="mt-4 text-xs text-ink-900/50">
            Kein Spam. Jederzeit abbestellbar.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-ink-900 mb-4">
          Letzte Ausgaben
        </h2>
        {issues.length === 0 ? (
          <p className="text-sm text-ink-900/60">
            Noch keine Ausgaben veröffentlicht.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
            {issues.map((i) => (
              <li key={i.id} className="p-4 flex items-center justify-between">
                <Link
                  href={`/brief/${i.year}-kw${pad(i.kw)}-${i.language}`}
                  className="text-ink-900 hover:text-tracer font-medium"
                >
                  KW {i.kw}, {i.year} · {i.language.toUpperCase()}
                </Link>
                <span className="text-xs text-ink-900/50">
                  {i.sent_at
                    ? new Date(i.sent_at).toLocaleDateString("de-DE", {
                        dateStyle: "medium",
                      })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
