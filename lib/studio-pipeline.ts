/**
 * Studio-Pipeline — wiederverwendbare Image-Generation für Studio-Briefs.
 * Wird sowohl vom HTTP-Endpoint /api/studio/generate als auch von
 * Server Actions (Onboarding, Dashboard, Cron) aufgerufen.
 */
import { craftImagePrompt } from "@/lib/prompt";
import { generateImage } from "@/lib/replicate";
import { composeFinalImage } from "@/lib/image-compose";
import { uploadStudioImage } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase";

export interface BrandConfig {
  name?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  tone?: string | null;
  focus_areas?: string[];
}

export interface PipelineInput {
  customerId: string | null;
  brand: BrandConfig;
  theme: string;
  language: "de" | "en";
  kw?: number;
  year?: number;
}

export interface PipelineResult {
  briefId: string;
  imageUrl: string;
  prompt: string;
}

export async function runStudioPipeline(
  input: PipelineInput,
): Promise<PipelineResult> {
  const supabase = supabaseAdmin();
  const { kw, year } = currentKwYear(input.kw, input.year);

  const { data: brief, error: insertErr } = await supabase
    .from("content_brief")
    .insert({
      customer_id: input.customerId,
      kw,
      year,
      language: input.language,
      theme: input.theme,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !brief) {
    throw new Error(
      `content_brief insert failed: ${insertErr?.message ?? "unknown"}`,
    );
  }
  const briefId = brief.id as string;

  try {
    const prompt = await craftImagePrompt({
      theme: input.theme,
      brand: {
        name: input.brand.name,
        primary_color: input.brand.primary_color ?? undefined,
        tone: input.brand.tone ?? undefined,
        focus_areas: input.brand.focus_areas,
      },
      language: input.language,
    });

    const baseImage = await generateImage({
      prompt,
      aspectRatio: "16:9",
      outputFormat: "png",
    });

    const composed = await composeFinalImage({
      baseImage,
      logoUrl: input.brand.logo_url ?? null,
    });

    const upload = await uploadStudioImage({
      customerId: input.customerId,
      kw,
      year,
      buffer: composed,
    });

    await supabase
      .from("content_brief")
      .update({
        status: "generated",
        image_url: upload.publicUrl,
        image_storage_path: upload.storagePath,
        prompt_used: prompt,
      })
      .eq("id", briefId);

    return { briefId, imageUrl: upload.publicUrl, prompt };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("content_brief")
      .update({ status: "failed", error_message: msg })
      .eq("id", briefId);
    throw err;
  }
}

export function currentKwYear(
  kwOverride?: number,
  yearOverride?: number,
): { kw: number; year: number } {
  if (kwOverride && yearOverride) return { kw: kwOverride, year: yearOverride };
  // ISO 8601 Woche — Donnerstag der Woche bestimmt das KW-Jahr.
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const kw = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { kw: kwOverride ?? kw, year: yearOverride ?? d.getUTCFullYear() };
}
