"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

/**
 * Notifications UI shell. No customer_notifications table in current schema —
 * do not invent fake alerts.
 */
export default function AccountNotificationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">الإشعارات</h2>
        <p className="mt-1 text-sm text-[#718096]">
          تنبيهات الطلبات والحساب ستظهر هنا عند تفعيل خدمة الإشعارات.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white px-4 py-12 text-center">
        <Bell className="mx-auto mb-3 h-10 w-10 text-[#C8D0DC]" strokeWidth={1.5} />
        <p className="font-semibold text-[#14243A]">لا توجد إشعارات</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#718096]">
          لم يُربط بعد جدول إشعارات للعميل في قاعدة البيانات. عند إضافة الخدمة ستُعرض
          هنا إشعارات حقيقية فقط — بدون بيانات وهمية.
        </p>
        <Link
          href="/account/orders"
          className="mt-4 inline-block text-sm font-bold text-[#3157D5]"
        >
          متابعة الطلبات
        </Link>
      </div>
    </div>
  );
}
