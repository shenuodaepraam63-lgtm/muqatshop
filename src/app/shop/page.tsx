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
  const [{ data: groups }, products] = await Promise.all([
    supabase
      .from("category_groups")
      .select("id, name, slug, image")
      .eq("is_active", true)
      .order("sort_order"),
    fetchShopProducts({
      sort: sp.sort,
      stock: sp.stock,
      type: sp.type,
      q: sp.q,
    }),
  ]);

  const groupList = groups || [];

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
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">المتجر</h1>
            <p className="text-sm text-muted mt-1">تصفح حسب المجموعة — التصنيفات داخل كل مجموعة</p>
          </div>
          <Link href="/categories" className="text-sm text-[#0042EB] hover:underline">
            شجرة التصنيفات كاملة
          </Link>
        </div>

        {groupList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {groupList.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${encodeURIComponent(g.slug)}`}
                className="rounded-2xl bg-[#f5f1e8] border border-[#e8e2d9] px-4 py-6 text-center hover:shadow-md hover:border-ink/20 transition"
              >
                <span className="font-semibold text-ink block">{g.name}</span>
                <span className="text-[11px] text-muted mt-1 block">عرض التصنيفات</span>
              </Link>
            ))}
          </div>
        )}

        <Suspense fallback={null}>
          <ProductFilters showCategory={false} categories={[]} />
        </Suspense>

        <h2 className="text-lg font-bold mb-4 mt-2">كل المنتجات</h2>
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
