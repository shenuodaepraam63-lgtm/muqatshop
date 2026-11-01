"use client";

import { formatPrice } from "@/lib/utils";

type Props = {
  total: number;
  loading: boolean;
  disabled?: boolean;
  label?: string;
  onPlaceOrder: () => void;
};

export function MobileCheckoutBar({
  total,
  loading,
  disabled,
  label = "تأكيد الطلب",
  onPlaceOrder,
}: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#E5EAF1] bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden"
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-[#667085]">الإجمالي المستحق</p>
          <p className="text-lg font-bold text-[#14243A]">{formatPrice(total)}</p>
        </div>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={loading || disabled}
          className="h-[52px] min-w-[160px] shrink-0 rounded-[10px] bg-[#3157D5] px-5 text-[15px] font-bold text-white hover:bg-[#2447B8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "جاري الإرسال..." : label}
        </button>
      </div>
    </div>
  );
}
