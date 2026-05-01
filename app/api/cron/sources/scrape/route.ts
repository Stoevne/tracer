/**
 * GET/POST /api/cron/sources/scrape
 *
 * Auth:    Authorization: Bearer $CRON_SECRET (Vercel Cron Header)
 * Cron:    täglich 04:00 UTC (vercel.json)
 * Aufgabe: alle aktiven `source`-Einträge scrapen, neue news_items
 *          dedupliziert anlegen, Embeddings via Voyage berechnen.
 *
 * Tolerant: einzelne Quellen-Fehler stoppen den Run nicht.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchFeed, type FeedItem } from "@/lib/rss";
import { embedTexts } from "@/lib/voyage";
import { checkCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Vercel Pro

interface SourceRow {
  id: string;
  name: string;
  url: string;
  type: string;
  language: "de" | "en";
}

interface RunReport {
  source: string;
  fetched: number;
  inserted: number;
  embedded: number;
  error?: string;
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const auth = checkCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const supabase = supabaseAdmin();
  const { data: sources, error } = await supabase
    .from("source")
    .select("id, name, url, type, language")
    .eq("active", true);

  if (error || !sources) {
    return NextResponse.json(
      { ok: false, error: `Could not load sources: ${error?.message}` },
      { status: 500 },
    );
  }

  const reports: RunReport[] = [];

  for (const s of sources as SourceRow[]) {
    const report: RunReport = {
      source: s.name,
      fetched: 0,
      inserted: 0,
      embedded: 0,
    };
    try {
      const items = await fetchFeed(s.url);
      report.fetched = items.length;

      const inserted = await persistItems(s, items);
      report.inserted = inserted.length;

      if (inserted.length > 0) {
        const texts = inserted.map((i) =>
          [i.title, i.content ?? ""].join("\n\n").trim(),
        );
        try {
          const vectors = await embedTexts(texts, "document");
          for (let idx = 0; idx < inserted.length; idx++) {
            await supabase
              .from("news_item")
              .update({ embedding: vectors[idx] as unknown as string })
              .eq("id", inserted[idx].id);
          }
          report.embedded = vectors.length;
        } catch (embedErr) {
          report.error = `Embedding-Fehler: ${embedErr instanceof Error ? embedErr.message : String(embedErr)}`;
        }
      }

      await supabase
        .from("source")
        .update({ last_fetched_at: new Date().toISOString(), fetch_error: null })
        .eq("id", s.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      report.error = msg;
      await supabase
        .from("source")
        .update({ last_fetched_at: new Date().toISOString(), fetch_error: msg })
        .eq("id", s.id);
    }
    reports.push(report);
  }

  const total = reports.reduce(
    (acc, r) => ({
      fetched: acc.fetched + r.fetched,
      inserted: acc.inserted + r.inserted,
      embedded: acc.embedded + r.embedded,
    }),
    { fetched: 0, inserted: 0, embedded: 0 },
  );

  return NextResponse.json({ ok: true, total, reports });
}

interface InsertedItem {
  id: string;
  title: string;
  content: string | null;
}

async function persistItems(
  source: SourceRow,
  items: FeedItem[],
): Promise<InsertedItem[]> {
  const supabase = supabaseAdmin();
  if (items.length === 0) return [];

  // Bestehende URLs filtern (Dedupe)
  const urls = items.map((i) => i.url);
  const { data: existing } = await supabase
    .from("news_item")
    .select("url")
    .in("url", urls);

  const existingSet = new Set((existing ?? []).map((e) => e.url as string));
  const fresh = items.filter((i) => !existingSet.has(i.url));
  if (fresh.length === 0) return [];

  const rows = fresh.map((i) => ({
    source_id: source.id,
    title: i.title.slice(0, 500),
    url: i.url,
    content: i.content?.slice(0, 50_000) ?? null,
    language: source.language,
    published_at: i.publishedAt?.toISOString() ?? null,
  }));

  const { data: inserted, error } = await supabase
    .from("news_item")
    .insert(rows)
    .select("id, title, content");

  if (error || !inserted) {
    throw new Error(`Insert failed for ${source.name}: ${error?.message}`);
  }
  return inserted as InsertedItem[];
}
