/**
 * Supabase-Storage-Helpers für Studio-Assets.
 *
 * Bucket-Konvention: "studio-assets" (public-read, write nur via service-role).
 * Pfad-Schema:  studio/{customerId|inline}/{year}-kw{kw}-{shortid}.png
 *
 * Bucket muss in Supabase einmal manuell angelegt werden — siehe
 * supabase/README.md.
 */
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "studio-assets";

export interface UploadInput {
  customerId: string | null;
  kw: number;
  year: number;
  buffer: Buffer;
  contentType?: string;
}

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

export async function uploadStudioImage(
  input: UploadInput,
): Promise<UploadResult> {
  const supabase = supabaseAdmin();
  const ownerSegment = input.customerId ?? "inline";
  const shortId = Math.random().toString(36).slice(2, 10);
  const storagePath = `studio/${ownerSegment}/${input.year}-kw${pad2(input.kw)}-${shortId}.png`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, input.buffer, {
      contentType: input.contentType ?? "image/png",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
