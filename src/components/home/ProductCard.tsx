import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

type ProductCardProps = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  category?: string | null;
};

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  image,
  category,
}: ProductCardProps) {
  const onSale = compareAtPrice != null && compareAtPrice > price;

  return (
    <Link
      href={`/products/${encodeURIComponent(slug)}`}
      className="product-card group block rounded-2xl overflow-hidden bg-[#f5f1e8] transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-[#ebe6dc]">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover product-card-image"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
            صورة قادمة
          </div>
        )}
        {onSale && (
          <span className="absolute top-3 left-3 bg-ink text-page text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full">
            SAVE
          </span>
        )}
      </div>
      <div className="px-3 pt-3 pb-4">
        {category && (
          <p className="text-[10px] tracking-widest uppercase text-muted mb-1">
            {category}
          </p>
        )}
        <h3 className="text-sm font-semibold text-ink line-clamp-2 mb-1.5 leading-snug group-hover:opacity-80 transition">
          {name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-ink">{formatPrice(price)}</span>
          {onSale && (
            <span className="text-xs text-muted line-through">
              {formatPrice(compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
