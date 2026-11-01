"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { ensureCanPurchaseAsync, purchaseLoginHref } from "@/lib/purchase-guard";
import { ShoppingBag, ChevronLeft } from "lucide-react";

/**
 * Checkout page — Blueprint layout
 * Phase 1: route separation
 * Phase 2: modular sections + saved addresses + mobile bar
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
      if (useCartStore.getState().items.length === 0) {
        router.replace("/cart");
      }
    })();
  }, [router]);

  useEffect(() => {
    if (ready && items.length === 0) {
      router.replace("/cart");
    }
  }, [ready, items.length, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F6F8FB]">
        <p className="text-sm text-[#667085]">جاري تحميل صفحة إتمام الطلب...</p>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-28 md:pb-12">
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

          <div className="mt-5 flex items-center gap-2 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#E5EAF1] bg-white">
                1
              </span>
              <span>السلة</span>
            </div>
            <div className="h-px max-w-[40px] flex-1 bg-[#E5EAF1]" />
            <div className="flex items-center gap-1.5 font-semibold text-[#3157D5]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#3157D5] text-white">
                2
              </span>
              <span>إتمام الطلب</span>
            </div>
            <div className="h-px max-w-[40px] flex-1 bg-[#E5EAF1]" />
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#E5EAF1] bg-white">
                3
              </span>
              <span>تأكيد الطلب</span>
            </div>
          </div>
        </div>

        {!canCheckout ? (
          <div className="mx-auto max-w-lg rounded-[14px] border border-[#E5EAF1] bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#F6F8FB]">
              <ShoppingBag className="h-6 w-6 text-[#3157D5]" />
            </div>
            <h2 className="text-lg font-bold text-[#14243A]">
              إتمام الطلب يتطلب حسابًا
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#667085]">
              يمكنك تصفح السلة كزائر. لتأكيد الطلب سجّل الدخول أو أنشئ حسابًا.
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
                className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[#E5EAF1] bg-white px-6 text-[15px] font-semibold text-[#14243A]"
              >
                إنشاء حساب عميل
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
            <div className="order-2 min-w-0 lg:order-1">
              <CheckoutForm />
            </div>
            {/* Summary column shown inside form on lg via OrderSummaryPanel duplicate avoided:
                form already renders summary for lg; this keeps grid balance on mobile-first */}
            <aside className="order-1 lg:order-2 lg:hidden">
              {/* Mobile: short intro card only — full summary is in form + bottom bar */}
              <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-4">
                <p className="text-sm text-[#667085]">
                  {items.length} منتج · أكمل البيانات بالأسفل ثم اضغط تأكيد الطلب
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
