"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import type { ProductColor, ProductVariant } from "@/lib/supabase";
import { findVariant, variantPrice, variantStock } from "@/lib/supabase";
import { formatPrice, isSaleActive, salePercent } from "@/lib/utils";
import { whatsappProductUrl } from "@/lib/whatsapp";
import {
  ensureCanPurchaseAsync,
  redirectToCustomerAuth,
} from "@/lib/purchase-guard";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    saleEndsAt?: string | null;
    image: string;
    slug?: string;
    stock?: number | null;
  };
  colors?: ProductColor[];
  sizes?: string[];
  variants?: ProductVariant[];
};

export function ProductBuyBox({
  product,
  colors = [],
  sizes = [],
  variants = [],
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.has(product.id));
  const { status, canPurchase } = useAuthSession();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>("");
  const [colorIdx, setColorIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedColor = colorIdx != null ? colors[colorIdx] : undefined;
  const colorName = selectedColor?.name || "";
  const hasMatrix = variants.length > 0;
  const baseStock = product.stock ?? null;

  const stock = useMemo(() => {
    if (hasMatrix)
      return variantStock(
        { stock: baseStock, variants },
        size || null,
        colorName || null
      );
    return Number(baseStock) || 0;
  }, [hasMatrix, variants, baseStock, size, colorName]);

  const unitPrice = useMemo(() => {
    if (hasMatrix)
      return variantPrice(
        { price: product.price, variants },
        size || null,
        colorName || null
      );
    return product.price;
  }, [hasMatrix, variants, product.price, size, colorName]);

  const saleOn = isSaleActive(unitPrice, product.compareAtPrice, product.saleEndsAt);
  const pct =
    saleOn && product.compareAtPrice != null
      ? salePercent(unitPrice, Number(product.compareAtPrice))
      : 0;

  const needsSize = sizes.length > 0;
  const needsColor = colors.length > 0;
  const optionsComplete =
    (!needsSize || Boolean(size)) && (!needsColor || colorIdx != null);
  const isOut = stock <= 0;
  const sessionReady = status !== "loading";
  const canAdd = !isOut && optionsComplete && !loading && sessionReady;

  const sizeAvailable = (s: string) => {
    if (!hasMatrix) return true;
    if (colors.length === 0) return (findVariant(variants, s, null)?.stock ?? 0) > 0;
    return colors.some((c) => (findVariant(variants, s, c.name)?.stock ?? 0) > 0);
  };
  const colorAvailable = (cName: string) => {
    if (!hasMatrix) return true;
    if (sizes.length === 0) return (findVariant(variants, null, cName)?.stock ?? 0) > 0;
    return (findVariant(variants, size || null, cName)?.stock ?? 0) > 0;
  };

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pageUrl =
    typeof window !== "undefined" && product.slug
      ? `${window.location.origin}/products/${product.slug}`
      : undefined;
  const variantLabel = [size, colorName].filter(Boolean).join(" / ");
  const waHref = whatsappProductUrl(
    variantLabel ? `${product.name} (${variantLabel})` : product.name,
    pageUrl
  );

  const onAdd = async () => {
    if (!canAdd) return;

    // Guest: local cart allowed. Authenticated: re-check session against races.
    if (canPurchase) {
      const ok = await ensureCanPurchaseAsync();
      if (!ok) {
        redirectToCustomerAuth(
          product.slug ? `/products/${encodeURIComponent(product.slug)}` : "/shop"
        );
        return;
      }
    }

    setLoading(true);
    try {
      addItem({
        productId: product.id,
        name: variantLabel ? `${product.name} — ${variantLabel}` : product.name,
        price: unitPrice,
        basePrice: unitPrice,
        image: product.image,
        quantity: Math.min(qty, Math.max(1, stock)),
        variant: variantLabel || undefined,
      });
      setDone(true);
      window.setTimeout(() => setDone(false), 2800);
    } finally {
      setLoading(false);
    }
  };

  const onWish = () => {
    toggleWish({
      productId: product.id,
      name: product.name,
      slug: product.slug || product.id,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <>
      <div ref={panelRef} className="space-y-5">
        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-[25px] font-bold text-[#14243A] sm:text-[30px]">
              {formatPrice(unitPrice)}
            </span>
            {saleOn && product.compareAtPrice != null && (
              <span className="text-sm text-[#667085] line-through sm:text-base">
                {formatPrice(Number(product.compareAtPrice))}
              </span>
            )}
            {pct > 0 && (
              <span className="rounded-md bg-[#DC3545] px-2 py-0.5 text-xs font-bold text-white">
                خصم {pct}%
              </span>
            )}
          </div>
          <p
            className={`mt-2 text-sm font-semibold ${
              isOut ? "text-[#DC3545]" : "text-[#16A36A]"
            }`}
          >
            {isOut ? "غير متوفر حاليًا" : "متوفر"}
          </p>
        </div>

        {sizes.length > 0 && (
          <div>
            <p className="mb-2.5 text-sm font-medium text-[#14243A]">
              المقاس{size ? ` : ${size}` : " — اختر المقاس"}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const ok = sizeAvailable(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!ok}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      size === s
                        ? "border-[#3157D5] bg-[#3157D5] text-white"
                        : "border-[#E5EAF1] bg-white text-[#14243A] hover:border-[#3157D5]"
                    } ${!ok ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div>
            <p className="mb-2.5 text-sm font-medium text-[#14243A]">
              اللون{colorName ? ` : ${colorName}` : " — اختر اللون"}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => {
                const ok = colorAvailable(c.name);
                return (
                  <button
                    key={c.name + i}
                    type="button"
                    disabled={!ok}
                    onClick={() => setColorIdx(i)}
                    title={c.name}
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      colorIdx === i ? "border-[#3157D5] scale-110" : "border-[#E5EAF1]"
                    } ${!ok ? "opacity-30" : ""}`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[#14243A]">الكمية</span>
          <div className="flex h-[42px] items-center overflow-hidden rounded-lg border border-[#E5EAF1] bg-white">
            <button
              type="button"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-full w-10 place-items-center disabled:opacity-40"
              aria-label="تقليل"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              disabled={qty >= Math.max(1, stock)}
              onClick={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))}
              className="grid h-full w-10 place-items-center disabled:opacity-40"
              aria-label="زيادة"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(size || colorName) && (
          <p className="text-xs text-[#667085]">
            الاختيار: {[size, colorName].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onAdd()}
            disabled={!canAdd}
            className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#3157D5] text-[15px] font-bold text-white transition hover:bg-[#2447B8] disabled:cursor-not-allowed disabled:bg-[#C8D0DC] max-md:h-[46px] max-md:text-sm"
          >
            {!sessionReady || loading ? (
              "جاري التحميل..."
            ) : done ? (
              <>
                <Check className="h-4 w-4" /> تمت الإضافة
              </>
            ) : isOut ? (
              "غير متوفر"
            ) : !optionsComplete ? (
              "اختر الخيارات"
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> أضف إلى السلة
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onWish}
            className="grid h-[50px] w-[50px] place-items-center rounded-[10px] border border-[#E5EAF1] bg-white max-md:h-[46px] max-md:w-[46px]"
            aria-label={wished ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart
              className={`h-5 w-5 ${wished ? "fill-[#DC3545] text-[#DC3545]" : "text-[#14243A]"}`}
            />
          </button>
        </div>

        {done && (
          <div className="rounded-xl border border-[#C8E6D5] bg-[#F0FAF5] px-3 py-3 text-sm text-[#14243A]">
            <p className="font-semibold">تمت الإضافة إلى السلة</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/cart"
                className="rounded-lg bg-[#3157D5] px-3 py-1.5 text-xs font-semibold text-white"
              >
                عرض السلة
              </Link>
              <span className="rounded-lg border border-[#E5EAF1] bg-white px-3 py-1.5 text-xs font-semibold text-[#526174]">
                متابعة التسوق
              </span>
            </div>
          </div>
        )}

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#25D366] text-sm font-semibold text-[#25D366] hover:bg-emerald-50"
        >
          استفسار واتساب
        </a>
      </div>

      {showSticky && (
        <div className="fixed inset-x-0 bottom-[56px] z-40 border-t border-[#E5EAF1] bg-white/95 px-3 py-2 shadow-[0_-4px_16px_rgba(20,36,58,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto flex h-[56px] max-w-[1440px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#14243A]">
                {formatPrice(unitPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onAdd()}
              disabled={!canAdd}
              className="h-11 shrink-0 rounded-[10px] bg-[#3157D5] px-4 text-sm font-bold text-white disabled:bg-[#C8D0DC]"
            >
              {isOut ? "غير متوفر" : done ? "تمت ✓" : "أضف إلى السلة"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
