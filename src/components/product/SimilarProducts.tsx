import Link from "next/link";
import Image from "next/image";
import { productMainImage, type Product } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

export function SimilarProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="max-w-page mx-auto px-4 md:px-8 mt-14 mb-20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">منتجات مشابهة</h2>
        <Link
          href="/#products"
          className="text-sm text-muted hover:text-ink transition"
        >
          عرض الكل
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {products.map((p) => {
          const img = productMainImage(p);
          const onSale =
            p.compare_at_price != null &&
            Number(p.compare_at_price) > Number(p.price);
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="w-[160px] sm:w-[200px] shrink-0 group"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#ebe6dc] mb-2">
                {img && (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    sizes="200px"
                  />
                )}
                {onSale && (
                  <span className="absolute top-2 right-2 bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    خصم
                  </span>
                )}
              </div>
              <p className="text-sm font-medium line-clamp-2 leading-snug">{p.name}</p>
              <p className="text-sm mt-1">
                <span className="font-bold">{formatPrice(Number(p.price))}</span>
                {onSale && (
                  <span className="text-muted line-through text-xs mr-1.5">
                    {formatPrice(Number(p.compare_at_price))}
                  </span>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
