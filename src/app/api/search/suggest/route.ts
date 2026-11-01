import { NextRequest, NextResponse } from "next/server";
import { supabase, productMainImage } from "@/lib/supabase";
import { expandSearchTerms, scoreProductMatch } from "@/lib/search-normalize";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [], phrases: [] });
  }

  const terms = expandSearchTerms(q);
  const primary = terms[0] || q;

  // منتجات
  const orParts = terms
    .slice(0, 4)
    .map((t) => {
      const safe = t.replace(/[%_,]/g, " ").trim();
      if (!safe) return null;
      return `name.ilike.%${safe}%,brand.ilike.%${safe}%`;
    })
    .filter(Boolean);

  let products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    inStock: boolean;
  }[] = [];

  if (orParts.length) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, brand, description, stock, images, variants, is_active, compare_at_price, sale_ends_at")
      .eq("is_active", true)
      .or(orParts.join(","))
      .limit(24);

    const ranked = ((data as Record<string, unknown>[]) || [])
      .map((p) => ({
        raw: p,
        score: scoreProductMatch(q, {
          name: p.name as string,
          description: p.description as string,
          brand: p.brand as string,
        }),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    products = ranked.map(({ raw: p }) => {
      const variants = p.variants as { stock?: number }[] | undefined;
      const inStock = variants?.length
        ? variants.some((v) => Number(v.stock) > 0)
        : Number(p.stock) > 0;
      return {
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        price: Number(p.price),
        image: productMainImage(p as never) || "",
        inStock,
      };
    });
  }

  // تصنيفات
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug, image, parent_id")
    .eq("is_active", true)
    .ilike("name", `%${primary.replace(/[%_,]/g, " ")}%`)
    .limit(8);

  const categories = ((cats as { id: string; name: string; slug: string; image?: string; parent_id?: string | null }[]) || [])
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image || null,
      parent_id: c.parent_id || null,
    }));

  // عبارات مقترحة بسيطة من أسماء المنتجات المطابقة
  const phrases = products
    .map((p) => p.name)
    .filter((n) => n && n.toLowerCase() !== q.toLowerCase())
    .slice(0, 3);

  return NextResponse.json({ products, categories, phrases });
}
