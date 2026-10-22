"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const params = useSearchParams();
  const n = params.get("n");

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-ink text-page flex items-center justify-center text-2xl mx-auto mb-5">
        ✓
      </div>
      <h1 className="text-2xl font-bold mb-2">تم استلام طلبك</h1>
      <p className="text-muted mb-2">هنكلمك قريبًا لتأكيد التوصيل</p>
      {n && (
        <p className="text-sm font-medium mb-8">
          رقم الطلب: <span className="font-mono">{n}</span>
        </p>
      )}
      <Link
        href="/"
        className="inline-block bg-ink text-page px-8 py-3 rounded-full text-sm font-semibold"
      >
        العودة للمتجر
      </Link>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
