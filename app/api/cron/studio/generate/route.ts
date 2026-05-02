/**
 * GET/POST /api/cron/studio/generate
 *
 * Cron: Mittwoch 09:00 UTC (vercel.json)
 * Für jeden customer mit subscription_status in ('active','trialing') und
 * existierendem brand_profile: Theme picken, Bild generieren, Approval-Mail
 * an customer.email schicken.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { pickTheme } from "@/lib/theme-picker";
import { runStudioPipeline, currentKwYear } from "@/lib/studio-pipeline";
import { sendMail } from "@/lib/mail";
import { makeToken } from "@/lib/approve-token";
import { checkCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 300; // Hobby-Plan-Limit; ab ~10 aktiven Customers auf Pro-Plan oder Batch-Splitting umstellen

interface ActiveCustomer {
  id: string;
  email: string;
  subscription_status: string;
  brand_profile: {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    tone: string | null;
    focus_areas: string[];
    language: "de" | "en" | "both";
  } | null;
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

  const { data: customers, error } = await supabase
    .from("customer")
    .select(
      "id, email, subscription_status, brand_profile(name, logo_url, primary_color, tone, focus_areas, language)",
    )
    .in("subscription_status", ["active", "trialing"])
    .is("paused_at", null);

  if (error) {
    return NextResponse.json(
      { ok: false, error: `customer load failed: ${error.message}` },
      { status: 500 },
    );
  }

  const list = (customers ?? []) as unknown as ActiveCustomer[];
  const reports: Array<{
    customer: string;
    status: string;
    briefId?: string;
    error?: string;
  }> = [];

  const { kw, year } = currentKwYear();

  for (const c of list) {
    const profile = Array.isArray(c.brand_profile)
      ? c.brand_profile[0]
      : c.brand_profile;
    if (!profile) {
      reports.push({ customer: c.email, status: "skipped (no brand_profile)" });
      continue;
    }
    const langs: ("de" | "en")[] =
      profile.language === "both" ? ["de", "en"] : [profile.language];

    for (const lang of langs) {
      try {
        const picked = await pickTheme({
          brand: {
            name: profile.name,
            tone: profile.tone,
            focus_areas: profile.focus_areas,
          },
          language: lang,
        });

        const result = await runStudioPipeline({
          customerId: c.id,
          brand: {
            name: profile.name,
            logo_url: profile.logo_url,
            primary_color: profile.primary_color,
            tone: profile.tone,
            focus_areas: profile.focus_areas,
          },
          theme: picked.theme,
          language: lang,
          kw,
          year,
        });

        // Mail an Customer mit Approve-Link
        try {
          await sendCustomerApprovalMail({
            to: c.email,
            customerId: c.id,
            briefId: result.briefId,
            kw,
            year,
            language: lang,
            theme: picked.theme,
            imageUrl: result.imageUrl,
          });
        } catch (mailErr) {
          console.error(`approval mail to ${c.email} failed`, mailErr);
        }

        reports.push({ customer: c.email, status: `generated:${lang}`, briefId: result.briefId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`studio cron ${c.email}/${lang} failed`, err);
        reports.push({ customer: c.email, status: `failed:${lang}`, error: msg });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    kw,
    year,
    customers: list.length,
    reports,
  });
}

async function sendCustomerApprovalMail(params: {
  to: string;
  customerId: string;
  briefId: string;
  kw: number;
  year: number;
  language: "de" | "en";
  theme: string;
  imageUrl: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";
  const token = makeToken("brief_content", params.briefId);
  const approveUrl = `${siteUrl}/api/studio/approve?brief=${params.briefId}&t=${token}`;
  const rejectUrl = `${siteUrl}/api/studio/approve?brief=${params.briefId}&t=${token}&action=reject`;
  const dashboardToken = makeToken("customer", params.customerId);
  const dashboardUrl = `${siteUrl}/studio/dashboard?customer=${params.customerId}&t=${dashboardToken}`;

  const subject =
    params.language === "de"
      ? `Tracer Studio — KW ${params.kw} Editorial bereit`
      : `Tracer Studio — Week ${params.kw} editorial ready`;

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:640px;margin:0 auto;color:#0b0f15;">
      <h1 style="font-size:22px;margin:0 0 8px;">Editorial KW ${params.kw} ist fertig</h1>
      <p style="color:#666;margin:0 0 20px;">Thema: <strong>${escapeHtml(params.theme)}</strong></p>
      <p><img src="${params.imageUrl}" alt="" style="max-width:100%;border-radius:8px;border:1px solid #eceef2;"/></p>
      <p style="margin-top:24px;">
        <a href="${approveUrl}" style="display:inline-block;background:#0ea5a5;color:white;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:500;">
          ✓ Freigeben
        </a>
        &nbsp;
        <a href="${rejectUrl}" style="display:inline-block;background:#fff;border:1px solid #ddd;color:#666;padding:10px 18px;border-radius:8px;text-decoration:none;">
          Verwerfen
        </a>
      </p>
      <p style="font-size:13px;color:#666;margin-top:24px;">
        Komplette Asset-Bibliothek: <a href="${dashboardUrl}">Studio Dashboard</a>
      </p>
    </div>
  `;
  const text = `Editorial KW ${params.kw} ist fertig\n\nThema: ${params.theme}\nBild: ${params.imageUrl}\n\nFreigeben: ${approveUrl}\nVerwerfen:  ${rejectUrl}\n\nDashboard: ${dashboardUrl}`;

  await sendMail({ to: params.to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
