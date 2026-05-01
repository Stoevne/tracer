"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

export type SubscribeState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Honeypot — Bot-Submissions füllen unsichtbare Felder aus.
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot.length > 0) {
    return { status: "success", email: "" };
  }

  const emailRaw = String(formData.get("email") ?? "").trim();
  const language = String(formData.get("language") ?? "de");

  if (!emailRaw) {
    return { status: "error", message: "Bitte gib eine E-Mail-Adresse ein." };
  }
  if (emailRaw.length > 254 || !EMAIL_RE.test(emailRaw)) {
    return { status: "error", message: "Diese E-Mail-Adresse sieht ungültig aus." };
  }
  if (language !== "de" && language !== "en") {
    return { status: "error", message: "Ungültige Sprachauswahl." };
  }

  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "";
  const ipHash = ip
    ? createHash("sha256").update(ip).digest("hex").slice(0, 32)
    : null;
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("subscriber")
      .insert({
        email: emailRaw.toLowerCase(),
        language,
        source: "coming_soon",
        ip_hash: ipHash,
        user_agent: userAgent,
      });

    if (error) {
      // Unique-Constraint auf lower(email) → schon eingetragen.
      if (error.code === "23505") {
        return { status: "success", email: emailRaw };
      }
      console.error("subscribe insert failed", error);
      return {
        status: "error",
        message: "Etwas ist schiefgelaufen. Versuch es gleich noch einmal.",
      };
    }

    return { status: "success", email: emailRaw };
  } catch (err) {
    console.error("subscribe action threw", err);
    return {
      status: "error",
      message: "Server momentan nicht erreichbar. Bitte später erneut.",
    };
  }
}
