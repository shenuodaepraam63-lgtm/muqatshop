"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { ensureCanPurchaseAsync, purchaseLoginHref } from "@/lib/purchase-guard";
import { ShoppingBag, ChevronLeft } from "lucide-react";

/**
 * Phase 1 — Dedicated Checkout page (Blueprint structure)
 * Layout: RTL · Desktop 65/35 · Progress indicator · Single-page form
 * Payment: Cash on Delivery only (current decision)
 */
export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const [ready, setReady] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);

  useEffect(() => {
    (async () => {
      const ok = await ensureCanPurchaseAsync();
      setCanCheckout(ok);
      setReady(true);
      if (!ok) return;
      // Empty cart → back to cart
      if (useCartStore.getState().items.length === 0) {
        router.replace("/cart");
      }
    })();
  }, [router]);

  // Redirect empty cart after hydration
  useEffect(() => {
    if (ready && items.length === 0) {
      router.replace("/cart");
    }
  }, [ready, items.length, router]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] bg-[#F6F8FB] flex items-center justify-center">
        <p className="text-sm text-[#667085]">جاري تحميل صفحة إتمام الطلب...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // redirect in progress
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-28 md:pb-12">
      {/* Breadcrumb / top bar */}
      <nav className="border-b border-[#E5EAF1] bg-white text-[12px] text-[#667085]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-2.5 sm:px-6">
          <Link href="/" className="hover:text-[#3157D5]">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-[#3157D5]">
            السلة
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#14243A]">إتمام الطلب</span>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 sm:py-8">
        {/* Page Header + Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold text-[#14243A] sm:text-[26px]">
                إتمام الطلب
              </h1>
              <p className="mt-1 text-sm text-[#667085]">
                راجع بياناتك وأكمل طلبك · {totalItems} قطعة في السلة
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5EAF1] bg-white px-3 text-xs font-semibold text-[#526174] hover:border-[#3157D5] hover:text-[#3157D5]"
            >
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              العودة للسلة
            </Link>
          </div>

          {/* Simple progress indicator (visual only) */}
          <div className="mt-5 flex items-center gap-2 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#E5EAF1] bg-white text-[#667085]">
                1
              </span>
              <span>السلة</span>
            </div>
            <div className="h-px flex-1 max-w-[40px] bg-[#E5EAF1]" />
            <div className="flex items-center gap-1.5 font-semibold text-[#3157D5]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#3157D5] text-white">
                2
              </span>
              <span>إتمام الطلب</span>
            </div>
            <div className="h-px flex-1 max-w-[40px] bg-[#E5EAF1]" />
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#E5EAF1] bg-white text-[#667085]">
                3
              </span>
              <span>تأكيد الطلب</span>
            </div>
          </div>
        </div>

        {/* Auth gate */}
        {!canCheckout ? (
          <div className="mx-auto max-w-lg rounded-[14px] border border-[#E5EAF1] bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#F6F8FB]">
              <ShoppingBag className="h-6 w-6 text-[#3157D5]" />
            </div>
            <h2 className="text-lg font-bold text-[#14243A]">
              إتمام الطلب يتطلب حسابًا
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#667085]">
              يمكنك تصفح السلة كزائر. لتأكيد الطلب سجّل الدخول أو أنشئ حسابًا —
              محتويات السلة تبقى محفوظة على هذا الجهاز.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href={purchaseLoginHref("/checkout")}
                className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[#3157D5] px-6 text-[15px] font-bold text-white hover:bg-[#2447B8]"
              >
                تسجيل الدخول لإتمام الطلب
              </Link>
              <Link
                href="/register/customer"
                className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[#E5EAF1] bg-white px-6 text-[15px] font-semibold text-[#14243A] hover:border-[#3157D5]"
              >
                إنشاء حساب عميل
              </Link>
            </div>
          </div>
        ) : (
          /* Main layout — Desktop 65/35, Mobile stacked */
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
            {/* Form column (right in RTL) */}
            <div className="order-2 lg:order-1">
              <CheckoutForm />
            </div>

            {/* Summary column — sticky on desktop */}
            <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
              <CheckoutSummaryCard />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutSummaryCard() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalUnits = useCartStore((s) => s.totalItems());

  return (
    <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-bold text-[#14243A]">ملخص الطلب</h2>

      <ul className="mb-4 max-h-[240px] space-y-3 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 text-sm">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E5EAF1] bg-[#F6F8FB]">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-contain p-0.5"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-medium text-[#14243A]">{item.name}</p>
              {item.variant && (
                <p className="text-[11px] text-[#667085]">{item.variant}</p>
              )}
              <p className="mt-0.5 text-xs text-[#667085]">
                {item.quantity} × {item.price.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-[#E5EAF1] pt-3 text-sm">
        <div className="flex justify-between text-[#667085]">
          <span>المنتجات ({totalUnits})</span>
          <span className="font-semibold text-[#14243A]">
            {totalPrice.toLocaleString("ar-EG")} ج.م
          </span>
        </div>
        <div className="flex justify-between text-[#667085]">
          <span>الشحن</span>
          <span className="text-xs">يُحسب بعد اختيار العنوان</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#667085]">
          الإجمالي النهائي يظهر بعد إدخال العنوان وتطبيق أي كوبون.
        </p>
      </div>

      <p className="mt-4 rounded-lg bg-[#F6F8FB] px-3 py-2 text-[11px] text-[#526174]">
        طريقة الدفع الحالية: <strong className="text-[#14243A]">الدفع عند الاستلام</strong>
      </p>
    </div>
  );
}
