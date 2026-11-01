"use client";

import Link from "next/link";
import { LifeBuoy, MessageCircle } from "lucide-react";

/**
 * Support hub. Ticket system not backed by DB tables yet — offer real contact paths only.
 */
export default function AccountSupportPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">الدعم والمساعدة</h2>
        <p className="mt-1 text-sm text-[#718096]">
          تواصل معنا بخصوص الطلبات أو الحساب. نظام التذاكر الداخلي غير مفعّل بعد في قاعدة
          البيانات.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="https://wa.me/201000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm transition hover:border-[#C8D6FF]"
        >
          <span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#EFF8F6] text-[#18A999]">
            <MessageCircle className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#14243A]">واتساب</p>
          <p className="mt-1 text-xs text-[#718096]">
            تواصل سريع (حدّث الرقم في الإعدادات عند اعتماده رسميًا).
          </p>
        </a>
        <a
          href="mailto:muqatshop@gmail.com"
          className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm transition hover:border-[#C8D6FF]"
        >
          <span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#EEF3FF] text-[#3157D5]">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#14243A]">البريد</p>
          <p className="mt-1 text-xs text-[#718096]">muqatshop@gmail.com</p>
        </a>
      </div>

      <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white p-5">
        <p className="text-sm font-semibold text-[#14243A]">تذاكر الدعم داخل الحساب</p>
        <p className="mt-2 text-sm leading-7 text-[#718096]">
          إنشاء ومتابعة التذاكر داخل `/account/support/[id]` يتطلب جداول تذاكر ورسائل في
          Supabase. لم تُنشأ بعد — لن تُعرض تذاكر وهمية.
        </p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-bold text-[#3157D5]">
          مراجعة الطلبات
        </Link>
      </div>
    </div>
  );
}
