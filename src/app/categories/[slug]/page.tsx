import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { supabase, productMainImage, type Category } from "@/lib/supabase";
import { fetchShopProducts } from "@/lib/shop-query";
import { ProductCard } from "@/components/home/ProductCard";
import { ProductFilters } from "@/components/shop/ProductFilters";

export const dynamic = "force-dynamic";

async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();
  return data as Category | null;
}

async function getAllCategories() {
  const { data } = await supabase.from("categories").select("id, name, slug").order("sort_order");
  return data || [];
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; stock?: string; type?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const [products, categories] = await Promise.all([
    fetchShopProducts({
      categoryId: category.id,
      sort: sp.sort,
      stock: sp.stock,
      type: sp.type,
    }),
    getAllCategories(),
  ]);

  return (
    <div className="bg-page min-h-screen">
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-ink">
            المتجر
          </Link>
          <span>/</span>
          <span className="text-ink">{category.name}</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{category.name}</h1>
        <p className="text-sm text-muted mb-6">{products.length} منتج</p>

        <Suspense fallback={null}>
          <ProductFilters
            showCategory
            categories={categories}
            activeCategory={category.slug}
          />
        </Suspense>

        {products.length === 0 ? (
          <p className="text-muted py-12 text-center">لا توجد منتجات في هذا القسم حاليًا</p>
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
                category={category.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
