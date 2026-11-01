"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { loadAccountIdentity } from "@/lib/account-identity";
import { buildSupportWhatsAppUrl } from "@/lib/support-contact";

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
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (res.ok) {
        if (res.identity.accountType === "supplier") setTypeLabel("تاجر");
        else if (res.identity.accountType === "affiliate") setTypeLabel("مسوق");
        const st =
          res.identity.supplierStatus || res.identity.affiliateStatus || "pending";
        setStatus(st);
        setEmail(res.identity.email);
        setName(res.identity.fullName);
      }
      setLoaded(true);
    })();
  }, []);

  const waUrl = useMemo(
    () =>
      buildSupportWhatsAppUrl({
        fullName: name,
        email,
        topic: `متابعة طلب انضمام (${typeLabel})`,
      }),
    [name, email, typeLabel]
  );

  return (
    <AuthShell
      title="طلبك قيد المراجعة"
      description="استلمنا بياناتك بنجاح. يقوم فريق Muqatshop بمراجعة طلب الانضمام، وسنخبرك عند تحديث حالته."
      brandingMessage="نوع الحساب منفصل عن حالة الاعتماد — الصلاحيات تُفعَّل بعد موافقة الإدارة فقط."
    >
      <div className="mb-5 flex justify-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#3157D5]">
          <Clock className="h-7 w-7" strokeWidth={1.75} />
        </span>
      </div>

      <div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] p-4 space-y-2 text-sm">
        {email ? (
          <div className="flex justify-between gap-2">
            <span className="text-[#718096]">البريد</span>
            <span className="font-semibold truncate">{email}</span>
          </div>
        ) : null}
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
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-[48px] rounded-[10px] border border-[#18A999]/40 bg-[#EFF8F6] font-semibold flex items-center justify-center text-sm text-[#149486]"
        >
          تواصل واتساب مع الدعم
        </a>
      </div>
    </AuthShell>
  );
}

export default function AccountPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
          جاري التحميل...
        </div>
      }
    >
      <PendingInner />
    </Suspense>
  );
}
