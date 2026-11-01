"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAccountIdentity, type AccountIdentity } from "@/lib/account-identity";
import { signOutToHome } from "@/lib/auth-session";
import {
  SUPPORT_WHATSAPP_DISPLAY,
  buildSupportWhatsAppUrl,
} from "@/lib/support-contact";

export default function AccountSettingsPage() {
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (res.ok) setIdentity(res.identity);
    })();
  }, []);

  const waUrl = useMemo(
    () =>
      buildSupportWhatsAppUrl({
        fullName: identity?.fullName,
        email: identity?.email,
        phone: identity?.phone,
        topic: "طلب حذف حساب / إعدادات",
      }),
    [identity]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">إعدادات الحساب</h2>
        <p className="mt-1 text-sm text-[#718096]">الأمان والوصول وإدارة الجلسة.</p>
      </div>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#14243A]">الحساب</h3>
        <div className="text-sm text-[#526174] space-y-1">
          <p>
            البريد:{" "}
            <span className="font-semibold text-[#202B3C]" dir="ltr">
              {identity?.email || "—"}
            </span>
          </p>
          <p>
            نوع الحساب:{" "}
            <span className="font-semibold text-[#202B3C]">
              {identity?.accountType === "affiliate"
                ? "مسوق"
                : identity?.accountType === "supplier"
                  ? "تاجر"
                  : "عميل"}
            </span>
          </p>
        </div>
        <Link
          href="/account/profile"
          className="inline-block text-sm font-semibold text-[#3157D5] hover:underline"
        >
          تعديل البيانات الشخصية
        </Link>
      </section>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#14243A]">الأمان</h3>
        <Link
          href="/forgot-password"
          className="block text-sm font-semibold text-[#3157D5] hover:underline"
        >
          تغيير / استعادة كلمة المرور
        </Link>
        <p className="text-xs text-[#718096]">
          يتم إرسال رابط آمن إلى بريدك. لا تُعرض رموز OTP في واجهة الحساب.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#14243A]">الدعم الفوري</h3>
        <p className="text-sm text-[#718096]">
          واتساب الدعم:{" "}
          <span className="font-semibold text-[#14243A]" dir="ltr">
            {SUPPORT_WHATSAPP_DISPLAY}
          </span>
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-[#18A999] px-4 py-2.5 text-sm font-semibold text-white"
        >
          فتح واتساب الآن
        </a>
        <Link href="/account/support" className="block text-sm font-semibold text-[#3157D5]">
          صفحة الدعم الكاملة
        </Link>
      </section>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#14243A]">الجلسة</h3>
        <button
          type="button"
          onClick={() => {
            void signOutToHome();
          }}
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-[#D64C4C]"
        >
          تسجيل الخروج
        </button>
        <p className="text-xs text-[#718096]">
          تسجيل الخروج إجراء صريح من هنا أو من القائمة الجانبية فقط.
        </p>
      </section>

      <section className="rounded-2xl border border-dashed border-[#E4E9F0] bg-[#F6F8FB] p-5">
        <h3 className="text-sm font-bold text-[#14243A]">حذف الحساب</h3>
        <p className="mt-2 text-sm leading-7 text-[#718096]">
          لطلب حذف الحساب والبيانات، تواصل عبر واتساب الدعم وسننفّذ الطلب وفق سياسة المنصة.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-[#18A999]"
        >
          طلب حذف عبر واتساب
        </a>
      </section>
    </div>
  );
}
