/**
 * POST /api/stripe/checkout
 *
 * Form-POST von /pricing. Body: tier=solo|praxis|team, email
 * Erstellt Stripe-Checkout-Session mit 14-Tage-Trial, redirected (303)
 * zur Checkout-URL.
 */
import { NextResponse } from "next/server";
import { stripe, priceIdForTier, TIERS, type Tier } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const tier = String(form.get("tier") ?? "") as Tier;
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!TIERS.includes(tier)) {
    return NextResponse.json({ ok: false, error: "Invalid tier" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";

  // Customer in DB anlegen/finden
  const supabase = supabaseAdmin();
  const { data: customer } = await supabase
    .from("customer")
    .upsert(
      { email, subscription_status: "inactive" },
      { onConflict: "email", ignoreDuplicates: false },
    )
    .select("id, stripe_customer_id")
    .single();

  if (!customer) {
    return NextResponse.json(
      { ok: false, error: "Could not create customer" },
      { status: 500 },
    );
  }

  let stripeCustomerId = customer.stripe_customer_id;
  const s = stripe();

  if (!stripeCustomerId) {
    const sc = await s.customers.create({
      email,
      metadata: { customer_id: customer.id },
    });
    stripeCustomerId = sc.id;
    await supabase
      .from("customer")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", customer.id);
  }

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceIdForTier(tier), quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { customer_id: customer.id, tier },
    },
    success_url: `${siteUrl}/studio/onboarding/success?stripe=ok`,
    cancel_url: `${siteUrl}/pricing?stripe=cancel`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json(
      { ok: false, error: "Checkout session has no URL" },
      { status: 500 },
    );
  }
  return NextResponse.redirect(session.url, { status: 303 });
}
