"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Check, Star } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { formatPrice, isSaleActive, salePercent } from "@/lib/utils";
import type { Product } from "@/lib/supabase";

function inStock(product: Product): boolean {
  if (product.variants?.length) return product.variants.some((v) => Number(v.stock) > 0);
  return Number(product.stock) > 0;
}

function Stars({ count = 0 }: { count?: number }) {
  const n = Math.max(0, Math.min(5, Math.round(count)));
  return (
    <div className="flex items-center gap-0.5" aria-label={n ? `تقييم ${n} من 5` : "بدون تقييمات"}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
            i < n ? "fill-[#F5B301] text-[#F5B301]" : "fill-transparent text-[#D0D5DD]"
          }`}
          strokeWidth={1.6}
        />
      ))}
      <span className="ms-1 text-[10px] text-[#98A2B3]">({n > 0 ? n : 0})</span>
    </div>
  );
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
  const saved = activeSale && compare != null ? Math.max(0, compare - price) : 0;
  const hasVariants = Boolean(product.variants?.length);
  const available = inStock(product);
  // No ratings table yet — show honest empty state (0)
  const rating = 0;

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
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white shadow-[0_2px_12px_rgba(20,36,58,0.06)] transition hover:shadow-[0_8px_24px_rgba(20,36,58,0.1)] ${
        compact ? "w-[168px] shrink-0 sm:w-[200px]" : ""
      }`}
    >
      {/* Media — package style */}
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="relative block aspect-square overflow-hidden bg-gradient-to-b from-[#FAFBFD] to-[#F3F5F9]"
        aria-label={product.name}
      >
        {image && !imgErr ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width:767px) 50vw, (max-width:1023px) 33vw, 20vw"
            className="object-contain p-3 sm:p-4"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[#98A2B3]">
            <ShoppingBag className="h-9 w-9" strokeWidth={1.3} />
          </div>
        )}

        {/* Savings badge — مثل وفر XX جنيه */}
        {activeSale && saved > 0 && (
          <span className="absolute right-2 top-2 z-[1] max-w-[70%] truncate rounded-full bg-[#E11D48] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:text-[11px]">
            وفر {formatPrice(saved)}
          </span>
        )}

        {!activeSale && percent <= 0 && product.is_featured ? (
          <span className="absolute right-2 top-2 z-[1] rounded-full bg-[#3157D5] px-2 py-0.5 text-[10px] font-bold text-white">
            مميز
          </span>
        ) : null}

        {!available && (
          <span className="absolute inset-x-2 bottom-2 z-[1] rounded-lg bg-[#14243A]/85 px-2 py-1 text-center text-[11px] font-semibold text-white">
            غير متوفر
          </span>
        )}

        <button
          type="button"
          onClick={onWish}
          className="absolute left-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(20,36,58,0.12)]"
          aria-label={wished ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <Heart
            className={`h-4 w-4 ${wished ? "fill-[#E11D48] text-[#E11D48]" : "text-[#14243A]"}`}
          />
        </button>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-2.5 max-md:px-2.5 max-md:pb-2.5">
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block space-y-1">
          <h3 className="line-clamp-2 min-h-[2.4rem] text-[13px] font-semibold leading-5 text-[#14243A] sm:text-sm">
            {product.name}
          </h3>

          <Stars count={rating} />

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-0.5">
            <span
              className={`text-[17px] font-bold tabular-nums max-md:text-[15px] ${
                activeSale ? "text-[#E11D48]" : "text-[#14243A]"
              }`}
            >
              {formatPrice(price)}
            </span>
            {activeSale && compare != null && (
              <span className="text-[12px] tabular-nums text-[#98A2B3] line-through max-md:text-[11px]">
                {formatPrice(compare)}
              </span>
            )}
          </div>
        </Link>

        <p
          className={`flex items-center gap-1.5 text-[11px] font-medium ${
            available ? "text-[#3157D5]" : "text-[#98A2B3]"
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              available ? "bg-[#3157D5]" : "bg-[#D0D5DD]"
            }`}
          />
          {available ? "في المخزن" : "غير متوفر"}
        </p>

        <div className="mt-auto pt-1">
          <button
            type="button"
            disabled={!available}
            onClick={onAdd}
            className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold transition max-md:h-9 max-md:text-xs ${
              available
                ? "bg-[#22C55E] text-white hover:bg-[#16A34A] active:bg-[#15803D]"
                : "cursor-not-allowed bg-[#E5EAF1] text-[#98A2B3]"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> تمت الإضافة
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
