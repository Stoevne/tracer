/**
 * Zentrales Env-Handling. Werte werden hier einmal gelesen und typisiert
 * exportiert, damit der Rest des Codes nie direkt auf process.env greift.
 *
 * Required-Keys werfen beim Boot, optionale dürfen leer bleiben — die
 * jeweiligen Module müssen selbst prüfen, ob sie verfügbar sind.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  siteUrl: required("NEXT_PUBLIC_SITE_URL"),

  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
  },

  cron: {
    secret: optional("CRON_SECRET"),
  },

  // Folgende Module werden in späteren Wochen aktiviert.
  replicate: { token: optional("REPLICATE_API_TOKEN") },
  openai: { apiKey: optional("OPENAI_API_KEY") },
  anthropic: { apiKey: optional("ANTHROPIC_API_KEY") },
  voyage: { apiKey: optional("VOYAGE_API_KEY") },
  beehiiv: {
    apiKey: optional("BEEHIIV_API_KEY"),
    publicationId: optional("BEEHIIV_PUBLICATION_ID"),
  },
  stripe: {
    secret: optional("STRIPE_SECRET_KEY"),
    publishable: optional("STRIPE_PUBLISHABLE_KEY"),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
    prices: {
      solo: optional("STRIPE_PRICE_SOLO"),
      praxis: optional("STRIPE_PRICE_PRAXIS"),
      team: optional("STRIPE_PRICE_TEAM"),
    },
  },
} as const;
