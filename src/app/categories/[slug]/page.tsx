import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

/** تصفح التصنيف داخل /shop */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const decoded = decodeURIComponent(slug);
  const { data: cat } = await supabase
    .from("categories")
    .select("id, slug, parent_id")
    .eq("slug", decoded)
    .maybeSingle();

  const paramsOut = new URLSearchParams();

  if (cat?.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", cat.parent_id)
      .maybeSingle();
    if (parent?.slug) {
      paramsOut.set("category", parent.slug);
      paramsOut.set("subcategory", cat.slug);
    } else {
      paramsOut.set("category", cat.slug);
    }
  } else if (cat?.slug) {
    paramsOut.set("category", cat.slug);
  } else {
    paramsOut.set("category", decoded);
  }

  for (const [key, raw] of Object.entries(sp)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && !paramsOut.has(key)) paramsOut.set(key, value);
  }

  redirect(`/shop?${paramsOut.toString()}`);
}
