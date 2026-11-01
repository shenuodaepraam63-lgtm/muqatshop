"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { formatPrice, isSaleActive, salePercent } from "@/lib/utils";
import type { Product } from "@/lib/supabase";

function inStock(product: Product): boolean {
  if (product.variants?.length) return product.variants.some((v) => Number(v.stock) > 0);
  return Number(product.stock) > 0;
}

export function MarketplaceProductCard({
  product,
  compact,
}: {
  product: Product;
  compact?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.has(product.id));
  const [added, setAdded] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const idx = Math.min(
    Math.max(product.main_image_index ?? 0, 0),
    Math.max((product.images?.length || 1) - 1, 0)
  );
  const image = product.images?.[idx] || product.images?.[0] || "";
  const price = Number(product.price);
  const compare = product.compare_at_price == null ? null : Number(product.compare_at_price);
  const activeSale = isSaleActive(price, compare, product.sale_ends_at);
  const percent = activeSale && compare ? salePercent(price, compare) : 0;
  const hasVariants = Boolean(product.variants?.length);
  const available = inStock(product);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!available) return;
    if (hasVariants) {
      window.location.href = `/products/${encodeURIComponent(product.slug)}`;
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price,
      basePrice: price,
      image,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image,
    });
  };

  return (
    <article
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-[12px] border border-[#E5EAF1] bg-white transition-[border-color] duration-[180ms] hover:border-[#3157D5] max-md:rounded-[10px] ${
        compact ? "w-[168px] shrink-0 sm:w-[200px]" : ""
      }`}
    >
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="relative block aspect-square overflow-hidden bg-[#F6F8FB]"
        aria-label={product.name}
      >
        {image && !imgErr ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width:767px) 50vw, (max-width:1023px) 33vw, 20vw"
            className="object-contain p-2"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[#718096]">
            <ShoppingBag className="h-9 w-9" strokeWidth={1.3} />
          </div>
        )}

        {activeSale && percent > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-[#D64C4C] px-2 py-0.5 text-[11px] font-bold text-white">
            خصم {percent}%
          </span>
        )}

        {!available && (
          <span className="absolute inset-x-2 bottom-2 rounded-md bg-[#14243A]/85 px-2 py-1 text-center text-[11px] font-semibold text-white">
            غير متوفر
          </span>
        )}

        <button
          type="button"
          onClick={onWish}
          className="absolute left-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm"
          aria-label={wished ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <Heart
            className={`h-4 w-4 ${wished ? "fill-[#D64C4C] text-[#D64C4C]" : "text-[#14243A]"}`}
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-3 max-md:p-2">
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-[#14243A]">
            {product.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[19px] font-bold text-[#14243A] max-md:text-[17px]">
              {formatPrice(price)}
            </span>
            {activeSale && compare != null && (
              <span className="text-[12px] text-[#718096] line-through max-md:text-[11px]">
                {formatPrice(compare)}
              </span>
            )}
          </div>
        </Link>

        <div className="mt-auto pt-2">
          <button
            type="button"
            disabled={!available}
            onClick={onAdd}
            className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition max-md:h-[34px] ${
              available
                ? "bg-[#3157D5] text-white hover:bg-[#2447B8] md:opacity-0 md:group-hover:opacity-100"
                : "cursor-not-allowed bg-[#E5EAF1] text-[#718096]"
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" /> تمت الإضافة
              </>
            ) : hasVariants ? (
              "اختر الخيارات"
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" /> أضف للسلة
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
