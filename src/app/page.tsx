import { Hero } from "@/components/home/Hero";
import { ProductCard } from "@/components/home/ProductCard";
import { supabase, productMainImage, type Product } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) {
      console.error("products fetch:", error.message);
      return [];
    }
    return (data as Product[]) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      <Hero />

      <section className="max-w-page mx-auto px-4 md:px-8 mt-12 md:mt-16 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">وصل حديثاً</h2>
          <a href="/collections" className="text-sm text-muted hover:text-ink transition">
            عرض الكل ←
          </a>
        </div>

        {products.length === 0 ? (
          <div className="rounded-media bg-card py-16 px-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-3">قريباً</h2>
            <p className="text-muted max-w-md mx-auto text-sm">
              جاري تجهيز المنتجات. أضف منتجات من لوحة التحكم على /admin
            </p>
          </div>
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
                image={productMainImage(p) || ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
