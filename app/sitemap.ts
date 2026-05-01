import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 3600; // einmal pro Stunde frisch

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/brief`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/brief/archive`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/brief/sponsor`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/studio/onboarding`, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("brief_issue")
      .select("kw, year, language, sent_at")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(200);

    const issuePages: MetadataRoute.Sitemap = (data ?? []).map((i) => ({
      url: `${base}/brief/${i.year}-kw${String(i.kw).padStart(2, "0")}-${i.language}`,
      lastModified: i.sent_at ? new Date(i.sent_at as string) : undefined,
      changeFrequency: "yearly",
      priority: 0.5,
    }));
    return [...staticPages, ...issuePages];
  } catch {
    return staticPages;
  }
}
