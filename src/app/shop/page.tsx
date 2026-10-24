import Link from "next/link";
import { Suspense } from "react";
import { supabase, productMainImage } from "@/lib/supabase";
import { fetchShopProducts } from "@/lib/shop-query";
import { ProductCard } from "@/components/home/ProductCard";
import { ProductFilters } from "@/components/shop/ProductFilters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "المتجر | Muqatshop",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; stock?: string; type?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [{ data: categories }, products] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("sort_order"),
    fetchShopProducts({
      sort: sp.sort,
      stock: sp.stock,
      type: sp.type,
      q: sp.q,
    }),
  ]);

  const cats = categories || [];

  return (
    <div className="bg-page min-h-screen">
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex gap-1">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-ink">المتجر</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">المتجر</h1>

        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="px-4 py-2 rounded-full border border-[#e8e2d9] text-sm hover:bg-ink hover:text-white transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <Suspense fallback={null}>
          <ProductFilters showCategory categories={cats} />
        </Suspense>

        {products.length === 0 ? (
          <p className="text-muted py-12 text-center">لا توجد منتجات</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.price)}
                compareAtPrice={
                  p.compare_at_price != null ? Number(p.compare_at_price) : null
                }
                saleEndsAt={p.sale_ends_at}
                image={productMainImage(p) || ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
