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
};

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  image,
}: ProductCardProps) {
  const onSale = compareAtPrice && compareAtPrice > price;

  return (
    <Link href={`/product/${slug}`} className="product-card group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-media bg-card mb-3">
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
          <span className="absolute top-3 right-3 bg-sale text-white text-xs font-bold px-2.5 py-1 rounded-full">
            خصم
          </span>
        )}
      </div>
      <div className="px-1">
        <h3 className="text-sm font-medium text-ink line-clamp-2 mb-1 group-hover:opacity-70 transition">
          {name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{formatPrice(price)}</span>
          {onSale && (
            <span className="text-sm text-muted line-through">
              {formatPrice(compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
