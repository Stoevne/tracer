import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/studio/library", "/studio/dashboard", "/studio/settings"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
