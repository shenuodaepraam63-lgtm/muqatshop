import Link from "next/link";
import { ProductCard } from "@/components/home/ProductCard";
import { supabase, productMainImage, type Product, type Category } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  const list = (products as Product[]) || [];
  const cats = (categories as Category[]) || [];

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">كل المنتجات</h1>

      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/collections"
            className="px-4 py-2 rounded-full text-sm bg-ink text-page"
          >
            الكل
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className="px-4 py-2 rounded-full text-sm bg-card border border-border hover:border-ink transition"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-muted text-center py-16">لا توجد منتجات حالياً</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {list.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={Number(p.price)}
              compareAtPrice={
                p.compare_at_price != null ? Number(p.compare_at_price) : null
              }
              image={productMainImage(p) || ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
