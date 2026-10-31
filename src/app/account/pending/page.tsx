"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { loadAccountIdentity } from "@/lib/account-identity";

const STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "تمت الموافقة",
  rejected: "لم تتم الموافقة",
  suspended: "الحساب موقوف",
  needs_information: "مطلوب استكمال البيانات",
};

function PendingInner() {
  const sp = useSearchParams();
  const typeQ = sp.get("type");
  const [typeLabel, setTypeLabel] = useState(typeQ === "supplier" ? "تاجر" : "مسوق");
  const [status, setStatus] = useState("pending");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (res.ok) {
        if (res.identity.accountType === "supplier") setTypeLabel("تاجر");
        else if (res.identity.accountType === "affiliate") setTypeLabel("مسوق");
        const st =
          res.identity.supplierStatus ||
          res.identity.affiliateStatus ||
          "pending";
        setStatus(st);
      }
      setLoaded(true);
    })();
  }, []);

  return (
    <AuthShell
      title="طلبك قيد المراجعة"
      description="استلمنا بياناتك بنجاح. يقوم فريق Muqatshop بمراجعة طلب الانضمام، وسنخبرك عند تحديث حالته."
    >
      <div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#718096]">نوع الحساب</span>
          <span className="font-semibold">{typeLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#718096]">الحالة</span>
          <span className="font-semibold text-[#3157D5]">
            {loaded ? STATUS_AR[status] || status : "..."}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/"
          className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold flex items-center justify-center"
        >
          العودة للرئيسية
        </Link>
        <Link
          href="/account/profile"
          className="w-full h-[48px] rounded-[10px] border border-[#E4E9F0] font-semibold flex items-center justify-center text-sm"
        >
          الملف الشخصي
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
