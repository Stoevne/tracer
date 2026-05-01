/**
 * Stripe-Client + Helpers.
 *
 * Stripe-Produkte/Preise legt Stephan im Dashboard an. Die Price-IDs werden
 * über Env-Vars in Vercel hinterlegt:
 *   STRIPE_PRICE_SOLO, STRIPE_PRICE_PRAXIS, STRIPE_PRICE_TEAM
 *
 * Webhook-Endpoint: /api/stripe/webhook — verifiziert via STRIPE_WEBHOOK_SECRET.
 */
import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  cached = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return cached;
}

export const TIERS = ["solo", "praxis", "team"] as const;
export type Tier = (typeof TIERS)[number];

export function priceIdForTier(tier: Tier): string {
  const map: Record<Tier, string | undefined> = {
    solo: process.env.STRIPE_PRICE_SOLO,
    praxis: process.env.STRIPE_PRICE_PRAXIS,
    team: process.env.STRIPE_PRICE_TEAM,
  };
  const id = map[tier];
  if (!id) {
    throw new Error(`Missing Stripe price ID for tier ${tier}`);
  }
  return id;
}

export function tierFromPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_SOLO) return "solo";
  if (priceId === process.env.STRIPE_PRICE_PRAXIS) return "praxis";
  if (priceId === process.env.STRIPE_PRICE_TEAM) return "team";
  return null;
}

export const TIER_DETAILS: Record<
  Tier,
  { label: string; priceEur: number; perks: string[] }
> = {
  solo: {
    label: "Solo",
    priceEur: 49,
    perks: [
      "Ein Brand-Profil",
      "Wöchentliches LinkedIn-Editorial",
      "1 Sprache (DE oder EN)",
      "Standard-Approval per Mail",
    ],
  },
  praxis: {
    label: "Praxis",
    priceEur: 99,
    perks: [
      "Ein Brand-Profil",
      "Wöchentliches LinkedIn-Editorial",
      "DE + EN parallel",
      "Themen-Pool, Approval-Dashboard",
      "Asset-Bibliothek (Re-Download)",
    ],
  },
  team: {
    label: "Team",
    priceEur: 199,
    perks: [
      "Bis zu 3 Brand-Profile",
      "Wöchentliches LinkedIn-Editorial pro Profil",
      "DE + EN parallel",
      "Priorisierter Support",
      "Custom Stilvorgaben",
    ],
  },
};
