"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken } from "@/lib/approve-token";

export type SettingsState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

const COLOR_RE = /^#?[0-9a-fA-F]{6}$/;

export async function updateBrand(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const customerId = String(formData.get("customer_id") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!verifyToken("settings", customerId, token)) {
    return { status: "error", message: "Token ungültig." };
  }

  const brandName = String(formData.get("brand_name") ?? "").trim();
  const primaryColorRaw = String(formData.get("primary_color") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();
  const focusRaw = String(formData.get("focus_areas") ?? "").trim();
  const language = String(formData.get("language") ?? "de");
  const logo = formData.get("logo");

  if (!brandName || brandName.length < 2 || brandName.length > 80) {
    return { status: "error", message: "Brand-Name fehlt oder zu lang." };
  }
  if (primaryColorRaw && !COLOR_RE.test(primaryColorRaw)) {
    return { status: "error", message: "Primärfarbe muss Hex sein." };
  }
  if (!["de", "en", "both"].includes(language)) {
    return { status: "error", message: "Ungültige Sprache." };
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

  const supabase = supabaseAdmin();

  let logoUrl: string | null = null;
  if (logo && typeof logo !== "string" && (logo as File).size > 0) {
    const file = logo as File;
    if (file.size > 5_000_000) {
      return { status: "error", message: "Logo zu groß (max 5 MB)." };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `brands/${customerId}/logo.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uErr } = await supabase.storage
      .from("studio-assets")
      .upload(path, buf, {
        contentType: file.type || "image/png",
        upsert: true,
      });
    if (uErr) {
      return { status: "error", message: `Logo-Upload: ${uErr.message}` };
    }
    const { data } = supabase.storage.from("studio-assets").getPublicUrl(path);
    logoUrl = data.publicUrl;
  }

  const { error } = await supabase.from("brand_profile").upsert(
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

  if (error) {
    return { status: "error", message: error.message };
  }
  revalidatePath("/studio/dashboard");
  return { status: "saved" };
}

export async function togglePause(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const customerId = String(formData.get("customer_id") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!verifyToken("settings", customerId, token)) {
    return { status: "error", message: "Token ungültig." };
  }
  const action = String(formData.get("action") ?? "pause");

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("customer")
    .update({ paused_at: action === "pause" ? new Date().toISOString() : null })
    .eq("id", customerId);

  if (error) {
    return { status: "error", message: error.message };
  }
  revalidatePath("/studio/settings");
  return { status: "saved" };
}
