/**
 * POST /api/stripe/webhook
 *
 * Verifiziert die Stripe-Signature über STRIPE_WEBHOOK_SECRET und syncht
 * subscription_status + subscription_tier auf customer.
 *
 * Stripe-Events: checkout.session.completed, customer.subscription.{created|updated|deleted},
 * invoice.payment_failed.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierFromPriceId } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type SubStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

function mapStripeStatus(s: Stripe.Subscription.Status): SubStatus {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json(
      { ok: false, error: "Missing signature or secret" },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Signature verification failed: ${msg}` },
      { status: 400 },
    );
  }

  const supabase = supabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const md = session.metadata ?? {};

        if (md.type === "sponsor_slot" && md.slot_id) {
          await supabase
            .from("sponsor_slot")
            .update({ paid_at: new Date().toISOString() })
            .eq("id", md.slot_id);
          break;
        }

        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (!stripeCustomerId) break;
        await supabase
          .from("customer")
          .update({
            subscription_status: "trialing",
            stripe_customer_id: stripeCustomerId,
          })
          .eq("stripe_customer_id", stripeCustomerId);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeCustomerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const status = mapStripeStatus(sub.status);
        const priceId = sub.items.data[0]?.price?.id;
        const tier = tierFromPriceId(priceId);
        const trialEndsAt = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;

        await supabase
          .from("customer")
          .update({
            subscription_status: status,
            subscription_tier: tier,
            trial_ends_at: trialEndsAt,
          })
          .eq("stripe_customer_id", stripeCustomerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (!stripeCustomerId) break;
        await supabase
          .from("customer")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", stripeCustomerId);
        break;
      }

      default:
        // andere Events ignorieren wir bewusst
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, received: event.type });
}
