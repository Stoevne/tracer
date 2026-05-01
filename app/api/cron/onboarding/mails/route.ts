/**
 * GET/POST /api/cron/onboarding/mails
 *
 * Cron: täglich 08:00 UTC (vercel.json)
 * Schickt Onboarding-Mails an Customers entsprechend ihrer Tage seit
 * onboarded_at. Tracking via onboarding_mail_log (unique customer_id+day).
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOnboardingMail, DAYS, type OnboardingDay } from "@/lib/onboarding-mails";
import { checkCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

interface CustomerRow {
  id: string;
  email: string;
  onboarded_at: string | null;
  brand_profile: { name: string } | { name: string }[] | null;
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
    .select("id, email, onboarded_at, brand_profile(name)")
    .not("onboarded_at", "is", null);

  if (error) {
    return NextResponse.json(
      { ok: false, error: `customer load: ${error.message}` },
      { status: 500 },
    );
  }

  const list = (customers ?? []) as unknown as CustomerRow[];
  const reports: Array<{ customer: string; day?: number; status: string; error?: string }> = [];

  for (const c of list) {
    if (!c.onboarded_at) continue;
    const ageDays = Math.floor(
      (Date.now() - new Date(c.onboarded_at).getTime()) / (24 * 3600_000),
    );
    const due = DAYS.filter((d) => d <= ageDays) as OnboardingDay[];
    if (due.length === 0) continue;

    // Welche wurden schon verschickt?
    const { data: log } = await supabase
      .from("onboarding_mail_log")
      .select("day")
      .eq("customer_id", c.id);
    const sent = new Set((log ?? []).map((l) => l.day as number));
    const todo = due.filter((d) => !sent.has(d));
    if (todo.length === 0) continue;

    const profile = Array.isArray(c.brand_profile) ? c.brand_profile[0] : c.brand_profile;
    const brandName = profile?.name ?? c.email.split("@")[0];

    for (const day of todo) {
      try {
        await sendOnboardingMail(day, {
          customerId: c.id,
          email: c.email,
          brandName,
        });
        await supabase.from("onboarding_mail_log").insert({
          customer_id: c.id,
          day,
        });
        reports.push({ customer: c.email, day, status: "sent" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`onboarding day=${day} ${c.email}`, err);
        reports.push({ customer: c.email, day, status: "failed", error: msg });
      }
    }
  }

  return NextResponse.json({ ok: true, reports });
}
