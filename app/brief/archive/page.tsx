import Link from "next/link";
import { Wordmark } from "@/app/_components/Wordmark";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata = {
  title: "Archiv — Tracer Brief",
};

export const dynamic = "force-dynamic";

interface IssueRow {
  id: string;
  kw: number;
  year: number;
  language: "de" | "en";
  sent_at: string | null;
}

export default async function BriefArchivePage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("brief_issue")
    .select("id, kw, year, language, sent_at")
    .eq("status", "sent")
    .order("sent_at", { ascending: false });

  const issues = (data ?? []) as IssueRow[];
  const grouped = groupByYear(issues);

  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="text-tracer">
            <Wordmark />
          </Link>
          <Link href="/brief" className="text-sm text-tracer hover:underline">
            ← Brief
          </Link>
        </header>

        <h1 className="text-3xl font-serif font-semibold text-ink-900 mb-2">
          Archiv
        </h1>
        <p className="text-sm text-ink-900/60 mb-10">
          {issues.length} {issues.length === 1 ? "Ausgabe" : "Ausgaben"}
        </p>

        {grouped.map(([year, list]) => (
          <section key={year} className="mb-10">
            <h2 className="text-xl font-semibold text-ink-900 mb-3">{year}</h2>
            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
              {list.map((i) => (
                <li
                  key={i.id}
                  className="p-4 flex items-center justify-between"
                >
                  <Link
                    href={`/brief/${i.year}-kw${pad(i.kw)}-${i.language}`}
                    className="text-ink-900 hover:text-tracer font-medium"
                  >
                    KW {i.kw} · {i.language.toUpperCase()}
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
          </section>
        ))}

        {issues.length === 0 ? (
          <p className="text-sm text-ink-900/60">Noch nichts veröffentlicht.</p>
        ) : null}
      </div>
    </main>
  );
}

function groupByYear(issues: IssueRow[]): [number, IssueRow[]][] {
  const m = new Map<number, IssueRow[]>();
  for (const i of issues) {
    const list = m.get(i.year) ?? [];
    list.push(i);
    m.set(i.year, list);
  }
  return [...m.entries()].sort((a, b) => b[0] - a[0]);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
