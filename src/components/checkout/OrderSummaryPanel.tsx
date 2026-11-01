"use client";

import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/store";

type Props = {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  governorate: string;
  appliedCode: string | null;
  markupProfit?: number;
  freeShippingHint?: string | null;
};

export function OrderSummaryPanel({
  items,
  subtotal,
  discount,
  shipping,
  total,
  governorate,
  appliedCode,
  markupProfit = 0,
  freeShippingHint,
}: Props) {
  const units = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-bold text-[#14243A]">ملخص الطلب</h2>

      <ul className="mb-4 max-h-[220px] space-y-3 overflow-y-auto">
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
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-[#E5EAF1] pt-3 text-sm">
        <div className="flex justify-between text-[#667085]">
          <span>المنتجات ({units})</span>
          <span className="font-semibold text-[#14243A]">
            {formatPrice(subtotal)}
          </span>
        </div>

        {markupProfit > 0 && (
          <div className="flex justify-between text-[#16A36A]">
            <span>ربحك (رفع سعر)</span>
            <span className="font-semibold">{formatPrice(markupProfit)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-[#16A36A]">
            <span>خصم{appliedCode ? ` (${appliedCode})` : ""}</span>
            <span className="font-semibold">-{formatPrice(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-[#667085]">
          <span>الشحن</span>
          <span>
            {!governorate
              ? "—"
              : shipping === 0
                ? "مجاني"
                : formatPrice(shipping)}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 border-t border-[#E5EAF1] pt-3">
          <span className="font-semibold text-[#14243A]">الإجمالي</span>
          <span className="text-[22px] font-bold text-[#14243A]">
            {formatPrice(total)}
          </span>
        </div>

        {freeShippingHint && (
          <p className="text-[11px] leading-relaxed text-[#667085]">
            {freeShippingHint}
          </p>
        )}
      </div>

      <p className="mt-4 rounded-lg bg-[#F6F8FB] px-3 py-2 text-[11px] text-[#526174]">
        الدفع: <strong className="text-[#14243A]">عند الاستلام</strong>
      </p>
    </div>
  );
}
