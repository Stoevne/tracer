/**
 * GET/POST /api/cron/brief/publish
 *
 * Cron: Montag 06:00 UTC (vercel.json)
 * Sucht alle brief_issue mit status=approved und sent_at IS NULL,
 * rendert HTML aus Markdown, pusht via Beehiiv API. Setzt sent_at + post_id.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createBeehiivPost } from "@/lib/beehiiv";
import { checkCronAuth } from "@/lib/cron-auth";
import { mdToHtml } from "@/lib/markdown";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  const beehiivKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!beehiivKey || !publicationId) {
    return NextResponse.json(
      { ok: false, error: "Beehiiv not configured" },
      { status: 500 },
    );
  }

  const supabase = supabaseAdmin();
  const { data: issues, error } = await supabase
    .from("brief_issue")
    .select("id, kw, year, language, draft_md, final_md")
    .eq("status", "approved")
    .is("sent_at", null);

  if (error) {
    return NextResponse.json(
      { ok: false, error: `load failed: ${error.message}` },
      { status: 500 },
    );
  }
  if (!issues || issues.length === 0) {
    return NextResponse.json({ ok: true, published: 0, reports: [] });
  }

  const reports: Array<{
    issueId: string;
    status: string;
    postId?: string;
    error?: string;
  }> = [];

  for (const issue of issues) {
    try {
      const baseMd = (issue.final_md as string | null) ?? (issue.draft_md as string | null);
      if (!baseMd) {
        throw new Error("no draft_md or final_md");
      }

      // Bezahlte Sponsor-Slots für diese Issue holen + injizieren
      const { data: slots } = await supabase
        .from("sponsor_slot")
        .select("id, copy_md, cta_url, sponsor:sponsor_id(name)")
        .eq("target_kw", issue.kw)
        .eq("target_year", issue.year)
        .eq("target_language", issue.language)
        .not("paid_at", "is", null)
        .is("inserted_into_issue_id", null);

      const sponsorBlock = renderSponsorBlock(
        (slots ?? []) as unknown as SponsorSlotRow[],
      );
      const md = sponsorBlock ? insertSponsorBlock(baseMd, sponsorBlock) : baseMd;

      const html = mdToHtml(md);
      const langLabel = issue.language === "de" ? "DE" : "EN";
      const title =
        issue.language === "de"
          ? `Tracer Brief — KW ${issue.kw}/${issue.year}`
          : `Tracer Brief — Week ${issue.kw}/${issue.year}`;

      const post = await createBeehiivPost({
        publicationId,
        apiKey: beehiivKey,
        title,
        subtitle: `[${langLabel}]`,
        contentHtml: html,
        status: "confirmed",
        sendEmail: true,
      });

      await supabase
        .from("brief_issue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          beehiiv_post_id: post.postId,
          final_md: md,
        })
        .eq("id", issue.id);

      // Sponsor-Slots als ausgeliefert markieren
      if (slots && slots.length > 0) {
        const slotIds = slots.map((s) => (s as { id: string }).id);
        await supabase
          .from("sponsor_slot")
          .update({ inserted_into_issue_id: issue.id })
          .in("id", slotIds);
      }

      reports.push({ issueId: issue.id as string, status: "sent", postId: post.postId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`brief/publish ${issue.id} failed`, err);
      reports.push({ issueId: issue.id as string, status: "failed", error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    published: reports.filter((r) => r.status === "sent").length,
    reports,
  });
}

interface SponsorSlotRow {
  id: string;
  copy_md: string;
  cta_url: string | null;
  sponsor: { name: string } | { name: string }[] | null;
}

function renderSponsorBlock(slots: SponsorSlotRow[]): string | null {
  if (slots.length === 0) return null;
  const blocks = slots.map((s) => {
    const sponsorName = Array.isArray(s.sponsor)
      ? s.sponsor[0]?.name
      : s.sponsor?.name;
    const cta = s.cta_url
      ? `\n\n[Mehr erfahren →](${s.cta_url})`
      : "";
    const attrib = sponsorName ? `\n\n*Anzeige · ${sponsorName}*` : "*Anzeige*";
    return `${attrib}\n\n${s.copy_md}${cta}`;
  });
  return [
    "---",
    "",
    "## Anzeige",
    blocks.join("\n\n---\n\n"),
    "",
    "---",
  ].join("\n");
}

function insertSponsorBlock(md: string, block: string): string {
  // Einfügen vor dem letzten "---" (vor dem outro), oder am Ende.
  const parts = md.split(/\n---\n/);
  if (parts.length >= 3) {
    // Strukturschema: heading / intro / --- / items / --- / outro
    parts.splice(parts.length - 1, 0, "\n" + block + "\n");
    return parts.join("\n---\n");
  }
  return md + "\n\n" + block;
}
