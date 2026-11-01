"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const params = useSearchParams();
  const n = params.get("n");

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#14243A] text-white flex items-center justify-center text-2xl mx-auto mb-5">
        ✓
      </div>
      <h1 className="text-2xl font-bold mb-2 text-[#14243A]">تم استلام طلبك</h1>
      <p className="text-[#718096] mb-2">هنكلمك قريبًا لتأكيد التوصيل</p>
      {n && (
        <p className="text-sm font-medium mb-6 text-[#202B3C]">
          رقم الطلب: <span className="font-mono">{n}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center rounded-full bg-[#3157D5] px-8 py-3 text-sm font-semibold text-white"
        >
          عرض طلباتي
        </Link>
        {n && (
          <Link
            href={`/track?n=${encodeURIComponent(n)}`}
            className="inline-flex items-center justify-center rounded-full border border-[#14243A] px-8 py-3 text-sm font-semibold text-[#14243A]"
          >
            تتبع الطلب
          </Link>
        )}
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full border border-[#E4E9F0] px-8 py-3 text-sm font-semibold text-[#526174]"
        >
          متابعة التسوق
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#718096]">...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
