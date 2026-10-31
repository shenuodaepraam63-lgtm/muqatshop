"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";

function PendingInner() {
  const sp = useSearchParams();
  const type = sp.get("type") === "supplier" ? "تاجر" : "مسوق";

  return (
    <AuthShell
      title="طلبك قيد المراجعة"
      description="استلمنا بياناتك بنجاح. يقوم فريق Muqatshop بمراجعة طلب الانضمام، وسنخبرك عند تحديث حالته."
    >
      <div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#718096]">نوع الحساب</span>
          <span className="font-semibold">{type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#718096]">الحالة</span>
          <span className="font-semibold text-[#3157D5]">قيد المراجعة</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/"
          className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold flex items-center justify-center"
        >
          العودة للرئيسية
        </Link>
        <a
          href="mailto:muqatshop@gmail.com"
          className="w-full h-[48px] rounded-[10px] border border-[#E4E9F0] font-semibold flex items-center justify-center text-sm"
        >
          التواصل مع الدعم
        </a>
      </div>
    </AuthShell>
  );
}

export default function AccountPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PendingInner />
    </Suspense>
  );
}
