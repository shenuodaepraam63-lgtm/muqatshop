"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Trash2, Minus, Plus, ShoppingBag, Store, ArrowLeft } from "lucide-react";
import { getMerchantSession } from "@/lib/merchant";
import { CartGuard } from "./CartGuard";

function CartPageInner() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updatePrice = useCartStore((s) => s.updatePrice);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalBase = useCartStore((s) => s.totalBase());
  const totalUnits = useCartStore((s) => s.totalItems());
  const [isMerchant, setIsMerchant] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    setIsMerchant(!!getMerchantSession());
  }, []);

  useEffect(() => {
    const next: Record<string, string> = {};
    items.forEach((i) => {
      next[i.id] = String(i.price);
    });
    setDrafts(next);
  }, [items]);

  const distinctCount = items.length;
  const lineTotal = useMemo(
    () => (price: number, qty: number) => price * qty,
    []
  );

  const applyPrice = (id: string, base: number, raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) {
      setErrors((e) => ({ ...e, [id]: "برجاء وضع سعر مناسب" }));
      return;
    }
    if (n < base) {
      setErrors((e) => ({ ...e, [id]: "ممنوع السعر أقل برجاء وضع سعر مناسب" }));
      setDrafts((d) => ({
        ...d,
        [id]: String(items.find((x) => x.id === id)?.price ?? base),
      }));
      return;
    }
    setErrors((e) => {
      const copy = { ...e };
      delete copy[id];
      return copy;
    });
    updatePrice(id, n);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#F6F8FB]">
        <nav className="border-b border-[#E5EAF1] bg-white text-[12px] text-[#667085]">
          <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-[4%] py-2.5 sm:px-[4%]">
            <Link href="/" className="hover:text-[#3157D5]">
              الرئيسية
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#14243A]">سلة التسوق</span>
          </div>
        </nav>
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
          <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-white border border-[#E5EAF1]">
            <ShoppingBag className="h-9 w-9 text-[#3157D5]" strokeWidth={1.4} />
          </div>
          <h1 className="text-[22px] font-bold text-[#14243A] sm:text-[28px]">
            سلتك فارغة حاليًا
          </h1>
          <p className="mt-2 text-sm text-[#667085]">
            ابدأ استكشاف المنتجات واختر اللي يناسبك
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-[10px] bg-[#3157D5] px-6 text-[15px] font-bold text-white hover:bg-[#2447B8]"
          >
            تسوق الآن
          </Link>
        </div>
      </div>
    );
  }

  const profit = totalPrice - totalBase;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 md:pb-10">
      <nav className="border-b border-[#E5EAF1] bg-white text-[12px] text-[#667085]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-[4%] py-2.5">
          <Link href="/" className="hover:text-[#3157D5]">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#3157D5]">
            المتجر
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#14243A]">سلة التسوق</span>
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-[4%] py-5 sm:py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[#14243A] sm:text-[28px]">
              سلة التسوق
            </h1>
            <p className="mt-1 text-sm text-[#667085]">
              {distinctCount} {distinctCount === 1 ? "منتج مختلف" : "منتجات مختلفة"}
              {totalUnits !== distinctCount ? ` — ${totalUnits} قطع` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/shop"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5EAF1] bg-white px-3 text-xs font-semibold text-[#526174] hover:border-[#3157D5] hover:text-[#3157D5]"
            >
              <Store className="h-3.5 w-3.5" />
              متابعة التسوق
            </Link>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="h-10 rounded-lg border border-[#E5EAF1] bg-white px-3 text-xs font-semibold text-[#DC3545] hover:bg-red-50"
              >
                مسح السلة
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setConfirmClear(false);
                  }}
                  className="h-10 rounded-lg bg-[#DC3545] px-3 text-xs font-semibold text-white"
                >
                  تأكيد المسح
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="h-10 rounded-lg border border-[#E5EAF1] bg-white px-3 text-xs font-semibold text-[#526174]"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {isMerchant && (
          <p className="mb-4 rounded-xl border border-[#E5EAF1] bg-white px-3 py-2 text-sm text-[#667085]">
            وضع المسوق: امسح السعر واكتب سعرك — ممنوع أقل من سعر المتجر.
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,68%)_minmax(0,32%)] lg:gap-6">
          {/* Items */}
          <ul className="space-y-3">
            {items.map((item) => {
              const base = item.basePrice ?? item.price;
              const variantText = item.variant?.trim();
              return (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-[12px] border border-[#E5EAF1] bg-white p-2.5 sm:gap-4 sm:p-4"
                >
                  <Link
                    href={`/products/${encodeURIComponent(item.productId)}`}
                    className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[8px] border border-[#E5EAF1] bg-[#F6F8FB] sm:h-[112px] sm:w-[112px] sm:rounded-[10px]"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="112px"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[#718096]">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-5 text-[#14243A] sm:text-base">
                          {item.name}
                        </h3>
                        {variantText && (
                          <p className="mt-1 text-[11px] text-[#667085] sm:text-xs">
                            {variantText}
                          </p>
                        )}
                      </div>
                      {confirmRemoveId === item.id ? (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              removeItem(item.id);
                              setConfirmRemoveId(null);
                            }}
                            className="rounded-md bg-[#DC3545] px-2 py-1 text-[11px] font-semibold text-white"
                          >
                            حذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded-md border border-[#E5EAF1] px-2 py-1 text-[11px] font-semibold text-[#526174]"
                          >
                            لا
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(item.id)}
                          className="shrink-0 rounded-lg p-2 text-[#667085] hover:bg-red-50 hover:text-[#DC3545]"
                          aria-label="حذف المنتج"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {!isMerchant && (
                      <div className="mt-2 flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-bold text-[#14243A] sm:text-lg">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-xs text-[#667085]">للقطعة</span>
                      </div>
                    )}

                    {isMerchant && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs text-[#667085]">
                          سعر المتجر: {formatPrice(base)}
                        </p>
                        <label className="block text-xs font-medium text-[#14243A]">
                          سعر البيع للعميل
                        </label>
                        <input
                          type="number"
                          min={base}
                          step="1"
                          value={drafts[item.id] ?? String(item.price)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDrafts((d) => ({ ...d, [item.id]: v }));
                            const n = Number(v);
                            if (v.trim() !== "" && !Number.isNaN(n) && n < base) {
                              setErrors((err) => ({
                                ...err,
                                [item.id]: "ممنوع السعر أقل برجاء وضع سعر مناسب",
                              }));
                            } else {
                              setErrors((err) => {
                                const c = { ...err };
                                delete c[item.id];
                                return c;
                              });
                            }
                          }}
                          onBlur={() =>
                            applyPrice(
                              item.id,
                              base,
                              drafts[item.id] ?? String(item.price)
                            )
                          }
                          className={`w-full max-w-[160px] rounded-lg border px-2 py-1.5 text-sm font-semibold ${
                            errors[item.id]
                              ? "border-[#DC3545]"
                              : "border-[#E5EAF1]"
                          }`}
                        />
                        {errors[item.id] && (
                          <p className="text-xs font-medium text-[#DC3545]">
                            {errors[item.id]}
                          </p>
                        )}
                        {!errors[item.id] && item.price > base && (
                          <p className="text-xs text-[#16A36A]">
                            ربحك:{" "}
                            {formatPrice((item.price - base) * item.quantity)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex h-9 items-center overflow-hidden rounded-lg border border-[#E5EAF1] bg-white">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="grid h-full w-9 place-items-center disabled:opacity-40"
                          aria-label="تقليل الكمية"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="grid h-full w-9 place-items-center"
                          aria-label="زيادة الكمية"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-[#14243A]">
                        {formatPrice(lineTotal(item.price, item.quantity))}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary only — checkout moved to /checkout */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
              <h2 className="mb-4 text-lg font-bold text-[#14243A] sm:text-xl">
                ملخص الطلب
              </h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-[#667085]">
                  <span>إجمالي المنتجات</span>
                  <span className="font-semibold text-[#14243A]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                {isMerchant && profit > 0 && (
                  <div className="flex justify-between text-[#16A36A]">
                    <span>ربحك المتوقع</span>
                    <span className="font-semibold">{formatPrice(profit)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#667085]">
                  <span>الشحن</span>
                  <span className="text-xs">يُحسب في صفحة إتمام الطلب</span>
                </div>
                <div className="border-t border-[#E5EAF1] pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-[#14243A]">الإجمالي المتوقع</span>
                    <span className="text-[21px] font-bold text-[#14243A] sm:text-2xl">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#667085]">
                    + الشحن بعد إدخال بيانات التوصيل
                  </p>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#3157D5] text-[15px] font-bold text-white hover:bg-[#2447B8] sm:h-[52px]"
              >
                إتمام الطلب
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <p className="mt-3 text-center text-[11px] text-[#667085]">
                الدفع عند الاستلام · بياناتك محمية
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <CartGuard>
      <CartPageInner />
    </CartGuard>
  );
}
