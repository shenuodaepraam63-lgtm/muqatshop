"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

type AccountChoice = "customer" | "affiliate" | "supplier";

const CHOICES: {
  id: AccountChoice;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "customer",
    title: "عميل",
    description: "أرغب في تصفح المنتجات وشراء ما يناسبني.",
    icon: "🛍",
  },
  {
    id: "affiliate",
    title: "مسوق",
    description: "أرغب في تسويق المنتجات والحصول على عمولات مقابل المبيعات الناجحة.",
    icon: "📈",
  },
  {
    id: "supplier",
    title: "تاجر",
    description: "أمتلك منتجات وأرغب في عرضها والتعاون مع Muqatshop.",
    icon: "🏪",
  },
];

function RegisterChooser() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = (sp.get("type") as AccountChoice) || null;
  const [selected, setSelected] = useState<AccountChoice | null>(
    initial && ["customer", "affiliate", "supplier"].includes(initial) ? initial : null
  );

  const hint = useMemo(
    () =>
      "يمكنك اختيار نوع الحساب المناسب لك. بعض أنواع الحسابات تتطلب مراجعة واعتماد الإدارة.",
    []
  );

  function continueNext() {
    if (!selected) return;
    // Gradual: reuse existing flows until full forms ship
    if (selected === "customer") {
      router.push("/welcome?tab=customer&mode=register");
      return;
    }
    if (selected === "affiliate") {
      router.push("/welcome?tab=merchant&mode=register");
      return;
    }
    // supplier — pending dedicated form; route to pending info for now via merchant path
    router.push("/welcome?tab=merchant&mode=register&as=supplier");
  }

  return (
    <AuthShell
      title="أنشئ حسابك على Muqatshop"
      description="ابدأ رحلتك معنا، واختر طريقة استخدامك للمنصة."
      brandingMessage="هوية واحدة لكل الأدوار — مع فصل واضح بين نوع الحساب وحالة الاعتماد."
      footer={
        <p className="text-center text-sm text-[#718096]">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-[#3157D5] hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      }
    >
      <p className="text-xs text-[#718096] mb-4 leading-relaxed">{hint}</p>

      <div className="grid gap-3 sm:grid-cols-1">
        {CHOICES.map((c) => {
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`text-start rounded-xl border px-4 py-4 transition-all duration-160 ${
                active
                  ? "border-[#3157D5] bg-[#3157D5]/5 ring-1 ring-[#3157D5]"
                  : "border-[#E4E9F0] bg-white hover:border-[#3157D5]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {c.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[17px] font-semibold text-[#202B3C]">{c.title}</span>
                    {active ? (
                      <span className="text-xs font-bold text-[#3157D5]">✓ محدد</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#718096] leading-relaxed">{c.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={continueNext}
        className="mt-6 w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white text-[15px] font-semibold hover:bg-[#2848b8] transition-colors disabled:opacity-50"
      >
        متابعة
      </button>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
          جاري التحميل...
        </div>
      }
    >
      <RegisterChooser />
    </Suspense>
  );
}
