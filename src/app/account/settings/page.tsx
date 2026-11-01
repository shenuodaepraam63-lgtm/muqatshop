"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAccountIdentity, type AccountIdentity } from "@/lib/account-identity";
import { signOutToHome } from "@/lib/auth-session";

export default function AccountSettingsPage() {
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (res.ok) setIdentity(res.identity);
    })();
  }, []);

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
        <h3 className="text-sm font-bold text-[#14243A]">الإشعارات</h3>
        <p className="text-sm text-[#718096]">
          تفضيلات الإشعارات داخل الموقع وواتساب ستُربط هنا بعد تفعيل خدمة الإشعارات في
          الخادم. حاليًا لا توجد جداول إشعارات مخصصة للعميل.
        </p>
        <Link href="/account/notifications" className="text-sm font-semibold text-[#3157D5]">
          عرض صفحة الإشعارات
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
          حذف الحساب متاح وفق سياسة المنصة. لم يُفعَّل مسار الحذف الذاتي بعد في الواجهة —
          تواصل مع الدعم لطلب حذف البيانات.
        </p>
        <Link href="/account/support" className="mt-3 inline-block text-sm font-semibold text-[#3157D5]">
          فتح الدعم
        </Link>
      </section>
    </div>
  );
}
