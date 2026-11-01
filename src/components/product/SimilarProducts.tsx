import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import type { Product } from "@/lib/supabase";

export function SimilarProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="home-container mt-10 mb-6" aria-label="منتجات مشابهة">
      <h2 className="mb-4 text-lg font-bold text-[#14243A] sm:text-[22px]">منتجات مشابهة</h2>
      <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar sm:gap-4">
        {products.map((p) => (
          <MarketplaceProductCard key={p.id} product={p} compact />
        ))}
      </div>
    </section>
  );
}
