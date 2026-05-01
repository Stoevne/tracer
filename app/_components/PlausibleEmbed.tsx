"use client";

import Script from "next/script";

/**
 * Plausible Analytics — cookie-frei, kein Banner nötig.
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN muss gesetzt sein, sonst rendert nichts.
 */
export function PlausibleEmbed() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
