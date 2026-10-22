"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice, isSaleActive, salePercent } from "@/lib/utils";
import { useCartStore } from "@/lib/store";

type ProductCardProps = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  saleEndsAt?: string | null;
  image: string;
  category?: string | null;
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  saleEndsAt,
  image,
  category,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const onSale = isSaleActive(price, compareAtPrice, saleEndsAt);
  const percent =
    onSale && compareAtPrice ? salePercent(price, compareAtPrice) : 0;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      name,
      price,
      image: image || "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

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
            className="object-cover product-card-image transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
            صورة قادمة
          </div>
        )}

        {onSale && percent > 0 && (
          <span className="absolute top-3 right-3 z-10 bg-sale text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
            خصم {percent}%
          </span>
        )}

        {/* إضافة للسلة عند المرور / اللمس */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-active:translate-y-0 group-active:opacity-100 transition duration-200 bg-gradient-to-t from-black/50 to-transparent">
          <button
            type="button"
            onClick={onAdd}
            className="w-full bg-white text-ink text-sm font-semibold py-2.5 rounded-full shadow hover:bg-ink hover:text-white transition"
          >
            {added ? "تمت الإضافة ✓" : "أضف إلى السلة"}
          </button>
        </div>
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
          {onSale && compareAtPrice != null && (
            <span className="text-xs text-muted line-through decoration-sale/80">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
