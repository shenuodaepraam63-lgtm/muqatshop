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
      .limit(24);
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

      <section id="products" className="max-w-page mx-auto px-4 md:px-8 mt-10 md:mt-14 mb-16 scroll-mt-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">المنتجات</h2>
        </div>

        {products.length === 0 ? (
          <div className="rounded-media bg-card py-16 px-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-3">قريباً</h2>
            <p className="text-muted max-w-md mx-auto text-sm">
              جاري تجهيز المنتجات من لوحة التحكم
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
                saleEndsAt={p.sale_ends_at}
                image={productMainImage(p) || ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
