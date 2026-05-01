/**
 * GET/POST /api/cron/brief/draft
 *
 * Cron: Sonntag 18:00 (vercel.json)
 * 1. news_items der letzten 7 Tage laden (pro Sprache)
 * 2. Claude curatet Top-Items + Markdown
 * 3. brief_issue + brief_items persistieren (status=pending_approval)
 * 4. Approve-Mail an OWNER_EMAIL via Resend
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { curateBrief, type CuratorOutput } from "@/lib/anthropic";
import { sendMail } from "@/lib/mail";
import { makeToken } from "@/lib/approve-token";
import { checkCronAuth } from "@/lib/cron-auth";
import { currentKwYear } from "@/lib/studio-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_CANDIDATES = 40;

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

  const { kw, year } = currentKwYear();
  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const supabase = supabaseAdmin();
  const reports: Array<{ language: "de" | "en"; status: string; issueId?: string; error?: string }> = [];

  for (const language of ["de", "en"] as const) {
    try {
      // Existiert schon eine Issue für diese KW + Sprache?
      const { data: existing } = await supabase
        .from("brief_issue")
        .select("id, status")
        .eq("kw", kw)
        .eq("year", year)
        .eq("language", language)
        .maybeSingle();

      if (existing && existing.status !== "rejected") {
        reports.push({
          language,
          status: `skipped (already ${existing.status})`,
          issueId: existing.id,
        });
        continue;
      }

      const { data: items, error: nErr } = await supabase
        .from("news_item")
        .select("id, title, url, content, published_at")
        .gte("fetched_at", since)
        .order("fetched_at", { ascending: false })
        .limit(MAX_CANDIDATES);

      if (nErr) throw new Error(`news_item load failed: ${nErr.message}`);
      if (!items || items.length === 0) {
        reports.push({ language, status: "no items in last 7 days" });
        continue;
      }

      const curated: CuratorOutput = await curateBrief({
        language,
        kw,
        year,
        items: items.map((i) => ({
          title: i.title as string,
          url: i.url as string,
          snippet: (i.content as string | null)?.slice(0, 1500) ?? null,
          publishedAt: i.published_at as string | null,
        })),
      });

      const draftMd = renderBriefMarkdown({ kw, year, language, curated });

      const issueRow = existing
        ? await supabase
            .from("brief_issue")
            .update({ draft_md: draftMd, status: "pending_approval" })
            .eq("id", existing.id)
            .select("id")
            .single()
        : await supabase
            .from("brief_issue")
            .insert({
              kw,
              year,
              language,
              draft_md: draftMd,
              status: "pending_approval",
            })
            .select("id")
            .single();

      if (issueRow.error || !issueRow.data) {
        throw new Error(`brief_issue persist failed: ${issueRow.error?.message}`);
      }
      const issueId = issueRow.data.id as string;

      // brief_item-Mapping (best-effort: verlinke wo URL match)
      const urlMap = new Map<string, string>(
        items.map((i) => [i.url as string, i.id as string]),
      );
      const briefItems = curated.items.map((c, idx) => ({
        issue_id: issueId,
        news_item_id: urlMap.get(c.url) ?? null,
        position: idx,
        summary_md: c.summary_md,
      }));
      // Vorhandene löschen (idempotent für Re-Runs)
      await supabase.from("brief_item").delete().eq("issue_id", issueId);
      await supabase.from("brief_item").insert(briefItems);

      // Approve-Mail
      const ownerEmail = process.env.OWNER_EMAIL;
      if (ownerEmail) {
        try {
          await sendApprovalMail({
            to: ownerEmail,
            issueId,
            kw,
            year,
            language,
            draftMd,
          });
        } catch (mailErr) {
          console.error("approval mail failed", mailErr);
          // Mail-Fehler ist nicht-fatal — Draft existiert in DB.
        }
      }

      reports.push({ language, status: "drafted", issueId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`brief/draft ${language} failed`, err);
      reports.push({ language, status: "failed", error: msg });
    }
  }

  return NextResponse.json({ ok: true, kw, year, reports });
}

function renderBriefMarkdown(params: {
  kw: number;
  year: number;
  language: "de" | "en";
  curated: CuratorOutput;
}): string {
  const { kw, year, language, curated } = params;
  const heading =
    language === "de"
      ? `# Tracer Brief — KW ${kw}, ${year}`
      : `# Tracer Brief — Week ${kw}, ${year}`;

  const items = curated.items
    .map(
      (i) =>
        `## ${i.headline}\n\n${i.summary_md}\n\n[${language === "de" ? "Zur Quelle" : "Read more"}](${i.url})`,
    )
    .join("\n\n---\n\n");

  return [
    heading,
    "",
    curated.intro_md,
    "",
    "---",
    "",
    items,
    "",
    "---",
    "",
    curated.outro_md,
  ].join("\n");
}

async function sendApprovalMail(params: {
  to: string;
  issueId: string;
  kw: number;
  year: number;
  language: "de" | "en";
  draftMd: string;
}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";
  const token = makeToken("brief", params.issueId);
  const approveUrl = `${siteUrl}/api/brief/approve?issue=${params.issueId}&t=${token}`;
  const rejectUrl = `${siteUrl}/api/brief/approve?issue=${params.issueId}&t=${token}&action=reject`;

  const langLabel = params.language === "de" ? "DE" : "EN";
  const subject = `[Tracer Brief KW ${params.kw}/${params.year} ${langLabel}] Draft zur Freigabe`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 640px; margin: 0 auto; color: #0b0f15;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Tracer Brief — KW ${params.kw}, ${params.year} (${langLabel})</h1>
      <p>Der Curator hat den Draft erstellt. Wenn er passt, klick:</p>
      <p>
        <a href="${approveUrl}" style="display:inline-block; background:#0ea5a5; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:500;">
          ✓ Freigeben — Versand am Montag 06:00
        </a>
        &nbsp;
        <a href="${rejectUrl}" style="display:inline-block; background:#fff; border:1px solid #ddd; color:#666; padding:10px 18px; border-radius:8px; text-decoration:none;">
          Verwerfen
        </a>
      </p>
      <hr style="border:none; border-top:1px solid #eceef2; margin:24px 0;"/>
      <pre style="white-space: pre-wrap; font-family: ui-serif, Georgia, serif; font-size: 14px; line-height: 1.5;">${escapeHtml(params.draftMd)}</pre>
    </div>
  `;
  const text = `Tracer Brief — KW ${params.kw}, ${params.year} (${langLabel})\n\nFreigeben: ${approveUrl}\nVerwerfen:  ${rejectUrl}\n\n---\n\n${params.draftMd}`;

  await sendMail({
    to: params.to,
    subject,
    html,
    text,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
