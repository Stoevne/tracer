"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { currentKwYear } from "@/lib/studio-pipeline";

export type SponsorState =
  | { status: "idle" }
  | { status: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function bookSponsorSlot(
  _prev: SponsorState,
  formData: FormData,
): Promise<SponsorState> {
  // Honeypot
  if (String(formData.get("website") ?? "").length > 0) {
    redirect("/brief/sponsor/thanks");
  }

  const sponsorName = String(formData.get("sponsor_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "")
    .trim()
    .toLowerCase();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const copyMd = String(formData.get("copy_md") ?? "").trim();
  const ctaUrl = String(formData.get("cta_url") ?? "").trim();
  const language = String(formData.get("language") ?? "de");

  if (!sponsorName || sponsorName.length < 2) {
    return { status: "error", message: "Sponsor-Name fehlt." };
  }
  if (!EMAIL_RE.test(contactEmail)) {
    return { status: "error", message: "E-Mail-Adresse ungültig." };
  }
  if (!copyMd || copyMd.length < 50) {
    return {
      status: "error",
      message: "Werbetext zu kurz (mind. 50 Zeichen).",
    };
  }
  if (copyMd.length > 1500) {
    return { status: "error", message: "Werbetext zu lang (max 1500)." };
  }
  if (!["de", "en"].includes(language)) {
    return { status: "error", message: "Ungültige Sprache." };
  }
  if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) {
    return { status: "error", message: "CTA-URL muss mit https:// beginnen." };
  }

  // Slot-Targeting: nächste Woche, gleiche Sprache
  const { kw, year } = nextKwYear();
  const priceCents = parseSponsorPriceCents();

  const supabase = supabaseAdmin();

  // Sponsor upsert
  const { data: sponsor, error: sErr } = await supabase
    .from("sponsor")
    .upsert(
      {
        name: sponsorName,
        contact_email: contactEmail,
        website_url: websiteUrl || null,
      },
      { onConflict: "contact_email" },
    )
    .select("id")
    .single();
  if (sErr || !sponsor) {
    return { status: "error", message: `Sponsor-Datensatz: ${sErr?.message}` };
  }

  // Slot anlegen (paid_at bleibt NULL bis Stripe-Webhook)
  const { data: slot, error: slotErr } = await supabase
    .from("sponsor_slot")
    .insert({
      sponsor_id: sponsor.id,
      target_kw: kw,
      target_year: year,
      target_language: language,
      copy_md: copyMd,
      cta_url: ctaUrl || null,
      price_eur_cents: priceCents,
    })
    .select("id")
    .single();
  if (slotErr || !slot) {
    return { status: "error", message: `Slot anlegen: ${slotErr?.message}` };
  }

  // Stripe Checkout (one-off payment)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";
  const sponsorPriceId = process.env.STRIPE_PRICE_SPONSOR_SLOT;
  let session;
  try {
    if (sponsorPriceId) {
      session = await stripe().checkout.sessions.create({
        mode: "payment",
        customer_email: contactEmail,
        line_items: [{ price: sponsorPriceId, quantity: 1 }],
        metadata: {
          type: "sponsor_slot",
          slot_id: slot.id,
        },
        success_url: `${siteUrl}/brief/sponsor/thanks?slot=${slot.id}`,
        cancel_url: `${siteUrl}/brief/sponsor?cancel=1`,
      });
    } else {
      // Fallback: ad-hoc price wenn kein PRICE_ID konfiguriert ist
      session = await stripe().checkout.sessions.create({
        mode: "payment",
        customer_email: contactEmail,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Tracer Brief — Sponsored Slot KW ${kw}/${year} (${language.toUpperCase()})`,
              },
              unit_amount: priceCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "sponsor_slot",
          slot_id: slot.id,
        },
        success_url: `${siteUrl}/brief/sponsor/thanks?slot=${slot.id}`,
        cancel_url: `${siteUrl}/brief/sponsor?cancel=1`,
      });
    }
  } catch (err) {
    return {
      status: "error",
      message: `Stripe-Checkout: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  await supabase
    .from("sponsor_slot")
    .update({ stripe_session_id: session.id })
    .eq("id", slot.id);

  if (session.url) {
    redirect(session.url);
  }
  return { status: "error", message: "Stripe-Session ohne URL." };
}

function nextKwYear(): { kw: number; year: number } {
  // Nächste Wocher = aktuelle Woche + 7 Tage
  const future = new Date(Date.now() + 7 * 24 * 3600_000);
  const d = new Date(
    Date.UTC(future.getUTCFullYear(), future.getUTCMonth(), future.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const kw = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { kw, year: d.getUTCFullYear() };
}

function parseSponsorPriceCents(): number {
  const raw = process.env.SPONSOR_SLOT_PRICE_CENTS;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 80000; // 800 € Default
}
