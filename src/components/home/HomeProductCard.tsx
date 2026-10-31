"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpLeft, Check, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { ensureCanPurchase, redirectToCustomerAuth } from "@/lib/purchase-guard";
import { formatPrice, isSaleActive, salePercent } from "@/lib/utils";
import type { Product } from "@/lib/supabase";

export function HomeProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageIndex = Math.min(Math.max(product.main_image_index ?? 0, 0), Math.max((product.images?.length || 1) - 1, 0));
  const image = product.images?.[imageIndex] || product.images?.[0] || "";
  const activeSale = isSaleActive(Number(product.price), product.compare_at_price == null ? null : Number(product.compare_at_price), product.sale_ends_at);
  const percent = activeSale && product.compare_at_price ? salePercent(Number(product.price), Number(product.compare_at_price)) : 0;
  const hasVariants = Boolean(product.variants?.length);

  const add = () => {
    if (hasVariants) return;
    if (!ensureCanPurchase()) {
      redirectToCustomerAuth(`/products/${encodeURIComponent(product.slug)}`);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      basePrice: Number(product.price),
      image,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="home-product-card group overflow-hidden rounded-xl border border-[#E4E9F0] bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(20,36,58,.09)]">
      <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block" aria-label={`تفاصيل ${product.name}`}>
        <div className="relative aspect-square overflow-hidden bg-[#F6F8FB]">
          {image && !imageFailed ? (
            <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-300 group-hover:scale-[1.035]" onError={() => setImageFailed(true)} />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[#718096]" aria-label="لا توجد صورة للمنتج">
              <ShoppingBag className="h-10 w-10" strokeWidth={1.3} />
            </div>
          )}
          {activeSale && percent > 0 && <span className="absolute right-3 top-3 rounded-md bg-[#D64C4C] px-2 py-1 text-xs font-bold text-white">خصم {percent}%</span>}
        </div>
        <div className="px-3 pt-3">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-6 text-[#202B3C]">{product.name}</h3>
          <div className="mt-1 flex min-h-7 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-bold text-[#14243A]">{formatPrice(Number(product.price))}</span>
            {activeSale && product.compare_at_price != null && <span className="text-xs text-[#718096] line-through">{formatPrice(Number(product.compare_at_price))}</span>}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 px-3 pb-3 pt-3">
        {hasVariants ? (
          <Link href={`/products/${encodeURIComponent(product.slug)}`} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#14243A] px-3 text-xs font-semibold text-[#14243A] transition hover:bg-[#14243A] hover:text-white">
            اختر الخيارات <ArrowUpLeft className="h-4 w-4" />
          </Link>
        ) : (
          <button type="button" onClick={add} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#3157D5] px-3 text-xs font-semibold text-white transition hover:bg-[#2447B8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3157D5]">
            {added ? <><Check className="h-4 w-4" /> أُضيف للسلة</> : <><ShoppingBag className="h-4 w-4" /> أضف للسلة</>}
          </button>
        )}
      </div>
    </article>
  );
}
