/**
 * POST /api/stripe/portal
 *
 * Form-POST aus /studio/settings (KW 8). Body: email
 * Erstellt Customer-Portal-Session, redirected (303) dorthin.
 */
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: customer } = await supabase
    .from("customer")
    .select("stripe_customer_id")
    .eq("email", email)
    .maybeSingle();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json(
      { ok: false, error: "Kein aktiver Kundenaccount für diese E-Mail." },
      { status: 404 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";
  const session = await stripe().billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${siteUrl}/studio/settings`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
