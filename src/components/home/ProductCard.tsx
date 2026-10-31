"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice, isSaleActive, salePercent } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { Heart } from "lucide-react";
import { ensureCanPurchase, redirectToCustomerAuth } from "@/lib/purchase-guard";

type ProductCardProps = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  saleEndsAt?: string | null;
  image: string;
  category?: string | null;
  stock?: number | null;
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
  stock,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.has(id));
  const [added, setAdded] = useState(false);
  const onSale = isSaleActive(price, compareAtPrice, saleEndsAt);
  const percent =
    onSale && compareAtPrice ? salePercent(price, compareAtPrice) : 0;
  const lowStock = stock != null && stock > 0 && stock <= 3;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ensureCanPurchase()) {
      redirectToCustomerAuth(`/products/${encodeURIComponent(slug)}`);
      return;
    }
    addItem({
      productId: id,
      name,
      price,
      basePrice: price,
      image: image || "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ensureCanPurchase()) {
      redirectToCustomerAuth(`/products/${encodeURIComponent(slug)}`);
      return;
    }
    toggleWish({ productId: id, name, slug, price, image: image || "" });
  };

  return (
    <Link
      href={`/products/${encodeURIComponent(slug)}`}
      className="product-card group block rounded-card overflow-hidden bg-white border border-border shadow-soft transition duration-200 hover:shadow-card hover:border-brand/20"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
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
          <span className="absolute top-3 right-3 z-10 bg-sale text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            خصم {percent}%
          </span>
        )}
        {lowStock && (
          <span className="absolute top-3 left-3 z-10 bg-ink/85 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            متبقي {stock}
          </span>
        )}
        <button
          type="button"
          onClick={onWish}
          className="absolute bottom-3 left-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-soft flex items-center justify-center transition hover:scale-105"
          aria-label="أمنية"
        >
          <Heart
            className={`w-4 h-4 ${wished ? "fill-sale text-sale" : "text-ink"}`}
          />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-active:translate-y-0 group-active:opacity-100 transition duration-200 bg-gradient-to-t from-black/55 to-transparent">
          <button
            type="button"
            onClick={onAdd}
            className="w-full bg-white text-ink text-sm font-semibold py-2.5 rounded-btn shadow-sm hover:bg-ink hover:text-white transition"
          >
            {added ? "تمت الإضافة ✓" : "أضف إلى السلة"}
          </button>
        </div>
      </div>
      <div className="px-3.5 pt-3.5 pb-4">
        {category && (
          <p className="text-[10px] tracking-wide text-brand font-medium mb-1">
            {category}
          </p>
        )}
        <h3 className="text-sm font-semibold text-ink line-clamp-2 mb-1.5 leading-snug group-hover:text-brand-dark transition">
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
