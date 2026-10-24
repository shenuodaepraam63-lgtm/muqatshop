import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://muqatshop.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/search`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/track`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/try-mug`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true).limit(500),
    supabase.from("categories").select("slug").limit(50),
  ]);

  const productUrls: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${BASE}/products/${encodeURIComponent(p.slug)}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const catUrls: MetadataRoute.Sitemap = (categories || []).map((c) => ({
    url: `${BASE}/categories/${encodeURIComponent(c.slug)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...catUrls, ...productUrls];
}
