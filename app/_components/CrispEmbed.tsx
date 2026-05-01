"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

/**
 * Lädt das Crisp-Chat-Widget falls NEXT_PUBLIC_CRISP_WEBSITE_ID gesetzt ist.
 * Stub für KW 8 — Knowledge-Base/AI-Bot-Konfiguration läuft in Crisp selbst.
 */
export function CrispEmbed() {
  const id = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    if (window.$crisp) return; // bereits geladen
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = id;
    const s = document.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    document.head.appendChild(s);
  }, [id]);

  return null;
}
