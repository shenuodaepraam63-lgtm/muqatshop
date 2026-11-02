"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildWhatsAppOrderConfirmUrl } from "@/lib/prepaid-products";

function SuccessContent() {
  const params = useSearchParams();
  const n = params.get("n");
  const prepaid = params.get("pay") === "prepaid";
  const total = params.get("t");

  const waUrl =
    prepaid && n
      ? buildWhatsAppOrderConfirmUrl({
          orderNumber: n,
          total: total || undefined,
        })
      : null;

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#14243A] text-white flex items-center justify-center text-2xl mx-auto mb-5">
        ✓
      </div>
      <h1 className="text-2xl font-bold mb-2 text-[#14243A]">تم استلام طلبك</h1>

      {prepaid ? (
        <div className="mb-6 rounded-2xl border border-[#C8E9E4] bg-[#EFF8F6] px-4 py-4 text-right">
          <p className="text-sm font-bold text-[#0f5c52]">
            مطلوب دفع مقدّم وتأكيد عبر واتساب
          </p>
          <p className="mt-2 text-xs leading-6 text-[#168B7D]">
            طلبك يتضمن سماعات إيربودز. الشحن يتم بعد تأكيد الطلب والدفع عبر
            واتساب. اضغط الزر بالأسفل للتواصل فورًا.
          </p>
        </div>
      ) : (
        <p className="text-[#718096] mb-2">هنكلمك قريبًا لتأكيد التوصيل</p>
      )}

      {n && (
        <p className="text-sm font-medium mb-6 text-[#202B3C]">
          رقم الطلب: <span className="font-mono">{n}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-8 py-3 text-sm font-semibold text-white"
          >
            تأكيد الطلب على واتساب
          </a>
        )}
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

      {prepaid && !waUrl && (
        <p className="mt-4 text-xs text-[#667085]">
          أضف رقم واتساب المتجر في متغير البيئة{" "}
          <code className="rounded bg-[#F6F8FB] px-1">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{" "}
          لتفعيل زر التواصل المباشر.
        </p>
      )}
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
