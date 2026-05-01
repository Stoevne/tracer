/**
 * POST /api/studio/generate
 *
 * Auth:    Authorization: Bearer $CRON_SECRET
 * Body:    siehe GenerateBody (zwei Modi: customer | inline)
 * Antwort: { ok: true, contentBriefId, imageUrl, prompt }
 *
 * Runtime: Node (sharp ist nativ, Edge geht nicht). Max 60s.
 */
import { NextResponse } from "next/server";
import { runStudioPipeline, type BrandConfig } from "@/lib/studio-pipeline";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateBody =
  | {
      mode: "customer";
      customer_id: string;
      theme: string;
      language?: "de" | "en";
      kw?: number;
      year?: number;
    }
  | {
      mode: "inline";
      brand: BrandConfig;
      theme: string;
      language?: "de" | "en";
      kw?: number;
      year?: number;
    };

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: CRON_SECRET unset" },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || !("mode" in body) || !body.theme) {
    return NextResponse.json(
      { ok: false, error: "Missing fields: mode, theme" },
      { status: 400 },
    );
  }
  const language = body.language ?? "de";

  let brand: BrandConfig;
  let customerId: string | null = null;
  if (body.mode === "customer") {
    if (!body.customer_id) {
      return NextResponse.json(
        { ok: false, error: "customer_id required in customer mode" },
        { status: 400 },
      );
    }
    customerId = body.customer_id;
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("brand_profile")
      .select("name, logo_url, primary_color, tone, focus_areas")
      .eq("customer_id", customerId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          error: `brand_profile not found for customer_id=${customerId}`,
        },
        { status: 404 },
      );
    }
    brand = data as BrandConfig;
  } else if (body.mode === "inline") {
    if (!body.brand) {
      return NextResponse.json(
        { ok: false, error: "brand required in inline mode" },
        { status: 400 },
      );
    }
    brand = body.brand;
  } else {
    return NextResponse.json(
      { ok: false, error: "mode must be 'customer' or 'inline'" },
      { status: 400 },
    );
  }

  try {
    const result = await runStudioPipeline({
      customerId,
      brand,
      theme: body.theme,
      language,
      kw: body.kw,
      year: body.year,
    });
    return NextResponse.json({
      ok: true,
      contentBriefId: result.briefId,
      imageUrl: result.imageUrl,
      prompt: result.prompt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("studio/generate failed", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
