"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export type OnboardState =
  | { status: "idle" }
  | { status: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_RE = /^#?[0-9a-fA-F]{6}$/;

export async function onboard(
  _prev: OnboardState,
  formData: FormData,
): Promise<OnboardState> {
  // Honeypot
  if (String(formData.get("website") ?? "").length > 0) {
    redirect("/studio/onboarding/success");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const brandName = String(formData.get("brand_name") ?? "").trim();
  const primaryColorRaw = String(formData.get("primary_color") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();
  const focusRaw = String(formData.get("focus_areas") ?? "").trim();
  const language = String(formData.get("language") ?? "de");
  const logo = formData.get("logo");

  if (!email || !EMAIL_RE.test(email)) {
    return { status: "error", message: "E-Mail-Adresse ungültig." };
  }
  if (!brandName || brandName.length < 2 || brandName.length > 80) {
    return { status: "error", message: "Brand-Name fehlt oder zu lang." };
  }
  if (primaryColorRaw && !COLOR_RE.test(primaryColorRaw)) {
    return {
      status: "error",
      message: "Primärfarbe muss als Hex-Wert angegeben sein (#0ea5a5).",
    };
  }
  if (!["de", "en", "both"].includes(language)) {
    return { status: "error", message: "Ungültige Sprachauswahl." };
  }

  const primaryColor = primaryColorRaw
    ? primaryColorRaw.startsWith("#")
      ? primaryColorRaw
      : `#${primaryColorRaw}`
    : null;
  const focusAreas = focusRaw
    ? focusRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    const supabase = supabaseAdmin();

    // Customer upsert (Email als business key)
    const { data: customer, error: cErr } = await supabase
      .from("customer")
      .upsert(
        { email, subscription_status: "inactive" },
        { onConflict: "email", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (cErr || !customer) {
      console.error("customer upsert failed", cErr);
      return {
        status: "error",
        message: `Konnte Kunden-Datensatz nicht anlegen: ${cErr?.message ?? "unbekannt"}`,
      };
    }
    const customerId = customer.id as string;

    // Logo-Upload (optional)
    let logoUrl: string | null = null;
    if (logo && typeof logo !== "string" && logo.size > 0) {
      const file = logo as File;
      if (file.size > 5_000_000) {
        return {
          status: "error",
          message: "Logo zu groß (max 5 MB).",
        };
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `brands/${customerId}/logo.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uErr } = await supabase.storage
        .from("studio-assets")
        .upload(path, buffer, {
          contentType: file.type || "image/png",
          upsert: true,
        });
      if (uErr) {
        console.error("logo upload failed", uErr);
        return {
          status: "error",
          message: `Logo-Upload fehlgeschlagen: ${uErr.message}`,
        };
      }
      const { data: pub } = supabase.storage
        .from("studio-assets")
        .getPublicUrl(path);
      logoUrl = pub.publicUrl;
    }

    // Brand-Profile upsert
    const { error: bErr } = await supabase.from("brand_profile").upsert(
      {
        customer_id: customerId,
        name: brandName,
        primary_color: primaryColor,
        tone: tone || null,
        focus_areas: focusAreas,
        language,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
      },
      { onConflict: "customer_id" },
    );

    if (bErr) {
      console.error("brand_profile upsert failed", bErr);
      return {
        status: "error",
        message: `Brand-Profil konnte nicht gespeichert werden: ${bErr.message}`,
      };
    }

    // Optional: einfacher IP-Hash zum Logging (nicht persistiert hier)
    headers(); // ensure dynamic — Form-Action muss dynamisch sein
  } catch (err) {
    console.error("onboard threw", err);
    return {
      status: "error",
      message: "Server momentan nicht erreichbar. Bitte später erneut.",
    };
  }

  redirect("/studio/onboarding/success");
}
