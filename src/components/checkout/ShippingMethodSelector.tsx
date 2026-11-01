"use client";

import { formatPrice } from "@/lib/utils";

type Props = {
  governorate: string;
  shippingFee: number;
  loading?: boolean;
};

/**
 * Phase 2: single shipping method based on current system rules
 * (governorate fee). Expand later when multiple carriers exist.
 */
export function ShippingMethodSelector({
  governorate,
  shippingFee,
  loading,
}: Props) {
  return (
    <section className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-1 text-lg font-bold text-[#14243A]">طريقة الشحن</h2>
      <p className="mb-4 text-xs text-[#667085]">
        يتم احتساب الشحن حسب المحافظة
      </p>

      {!governorate ? (
        <div className="rounded-xl border border-dashed border-[#E5EAF1] bg-[#F6F8FB] px-4 py-5 text-center text-sm text-[#667085]">
          اختر المحافظة أولاً لعرض تكلفة الشحن
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-[#E5EAF1] px-4 py-4 text-sm text-[#667085]">
          جاري حساب الشحن...
        </div>
      ) : (
        <div className="rounded-xl border border-[#3157D5] bg-[#EEF2FF] p-4 ring-1 ring-[#3157D5]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#14243A]">توصيل عادي</p>
              <p className="mt-1 text-xs text-[#526174]">
                إلى {governorate} · الدفع عند الاستلام
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-[#14243A]">
              {shippingFee === 0 ? "مجاني" : formatPrice(shippingFee)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#3157D5]">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="text-xs font-medium text-[#3157D5]">محدد</span>
          </div>
        </div>
      )}
    </section>
  );
}
